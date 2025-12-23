-- Migration: Allow users to create readings for their own profiles
-- Previously only owner/staff could create readings for persons
-- Now any user can create readings for persons they created

CREATE OR REPLACE FUNCTION public.create_reading(
    p_workspace_id uuid,
    p_spread_id uuid,
    p_owner_type public.reading_owner_type,
    p_owner_person_id uuid DEFAULT NULL,
    p_selected_deck_ids uuid[] DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_id uuid;
    caller_role public.workspace_role;
    card_n int;
    seed text;
    new_reading_id uuid;
    reading_count int;
    oldest_reading_id uuid;
    rec record;
    pos int := 1;
    person_creator_id uuid;
BEGIN
    -- Authentication check
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'No autenticado';
    END IF;

    -- Workspace membership check
    SELECT wm.role INTO caller_role
    FROM public.workspace_members wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = caller_id;

    IF caller_role IS NULL THEN
        RAISE EXCEPTION 'Sin acceso al workspace';
    END IF;

    -- Validate spread
    SELECT s.card_count INTO card_n
    FROM public.spreads s
    WHERE s.id = p_spread_id
      AND s.workspace_id = p_workspace_id
      AND s.status = 'published';

    IF card_n IS NULL THEN
        RAISE EXCEPTION 'Tirada inválida o no publicada';
    END IF;

    -- Validate person ownership if applicable
    IF p_owner_type = 'person' THEN
        IF p_owner_person_id IS NULL THEN
            RAISE EXCEPTION 'Falta person_id';
        END IF;

        -- Check if person exists and get creator
        SELECT p.created_by_user_id INTO person_creator_id
        FROM public.persons p
        WHERE p.id = p_owner_person_id
          AND p.workspace_id = p_workspace_id;

        IF person_creator_id IS NULL THEN
            RAISE EXCEPTION 'Persona inválida';
        END IF;

        -- Allow if: user is owner/staff OR user created the profile
        IF caller_role NOT IN ('owner', 'staff') AND person_creator_id != caller_id THEN
            RAISE EXCEPTION 'No autorizado para crear lecturas para esta persona';
        END IF;
    ELSE
        p_owner_person_id := NULL;
    END IF;

    -- Enforce 30 readings limit per owner (FIFO - delete oldest)
    IF p_owner_type = 'user' THEN
        SELECT COUNT(*) INTO reading_count
        FROM public.readings r
        WHERE r.workspace_id = p_workspace_id
          AND r.owner_type = 'user'
          AND r.owner_user_id = caller_id;

        WHILE reading_count >= 30 LOOP
            SELECT r.id INTO oldest_reading_id
            FROM public.readings r
            WHERE r.workspace_id = p_workspace_id
              AND r.owner_type = 'user'
              AND r.owner_user_id = caller_id
            ORDER BY r.created_at ASC
            LIMIT 1;

            DELETE FROM public.readings WHERE id = oldest_reading_id;
            reading_count := reading_count - 1;
        END LOOP;
    ELSIF p_owner_type = 'person' THEN
        SELECT COUNT(*) INTO reading_count
        FROM public.readings r
        WHERE r.workspace_id = p_workspace_id
          AND r.owner_type = 'person'
          AND r.owner_person_id = p_owner_person_id;

        WHILE reading_count >= 30 LOOP
            SELECT r.id INTO oldest_reading_id
            FROM public.readings r
            WHERE r.workspace_id = p_workspace_id
              AND r.owner_type = 'person'
              AND r.owner_person_id = p_owner_person_id
            ORDER BY r.created_at ASC
            LIMIT 1;

            DELETE FROM public.readings WHERE id = oldest_reading_id;
            reading_count := reading_count - 1;
        END LOOP;
    END IF;

    -- Generate random seed
    seed := encode(extensions.gen_random_bytes(16), 'hex');

    -- Create the reading record
    INSERT INTO public.readings (
        workspace_id,
        owner_type,
        owner_user_id,
        owner_person_id,
        created_by_user_id,
        spread_id,
        selected_deck_ids,
        random_seed
    )
    VALUES (
        p_workspace_id,
        p_owner_type,
        CASE WHEN p_owner_type = 'user' THEN caller_id ELSE NULL END,
        p_owner_person_id,
        caller_id,
        p_spread_id,
        p_selected_deck_ids,
        seed
    )
    RETURNING id INTO new_reading_id;

    -- Select random card_backs (messages) and create reading items
    -- Each card_back is associated with a card (arcángel)
    FOR rec IN
        WITH eligible_backs AS (
            SELECT 
                cb.id AS back_id,
                cb.back_image_path,
                cb.phrase,
                c.id AS card_id,
                c.name AS card_name,
                c.image_path AS card_image_path,
                c.short_message,
                c.meaning,
                c.meaning_extended
            FROM public.card_backs cb
            JOIN public.cards c ON c.id = cb.card_id
            WHERE cb.workspace_id = p_workspace_id
              AND cb.status = 'published'
              AND c.status = 'published'
              AND (
                  p_selected_deck_ids IS NULL
                  OR cardinality(p_selected_deck_ids) = 0
                  OR c.deck_id = ANY(p_selected_deck_ids)
              )
        ),
        ordered_backs AS (
            SELECT 
                eb.*,
                extensions.digest(seed || eb.back_id::text, 'sha256') AS sort_key
            FROM eligible_backs eb
            ORDER BY sort_key
            LIMIT card_n
        )
        SELECT * FROM ordered_backs ORDER BY sort_key
    LOOP
        INSERT INTO public.reading_items (
            reading_id,
            position_index,
            card_id,
            snapshot
        )
        VALUES (
            new_reading_id,
            pos,
            rec.card_id,
            jsonb_build_object(
                'card_id', rec.card_id,
                'card_name', rec.card_name,
                'card_image_path', rec.card_image_path,
                'back_id', rec.back_id,
                'back_image_path', rec.back_image_path,
                'phrase', rec.phrase,
                'short_message', rec.short_message,
                'meaning', rec.meaning,
                'meaning_extended', rec.meaning_extended
            )
        );
        pos := pos + 1;
    END LOOP;

    -- Verify we got enough cards
    IF pos - 1 < card_n THEN
        RAISE EXCEPTION 'No hay suficientes mensajes (reversos) publicados. Se necesitan %, hay %', card_n, pos - 1;
    END IF;

    RETURN new_reading_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_reading(uuid, uuid, public.reading_owner_type, uuid, uuid[]) TO authenticated;
