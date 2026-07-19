-- ============================================================
-- Momento · sample data
-- Run this AFTER your first Google sign-in (it attaches sample
-- albums to the first user in auth.users). Safe to re-run: it
-- clears previous sample data for that user first.
-- Images come from picsum.photos (already allowed in next.config).
-- ============================================================

do $$
declare
  uid uuid;
  a_kkn uuid; a_dieng uuid; a_hike uuid; a_anniv uuid; a_sby uuid;
  t_travel uuid; t_friends uuid; t_love uuid; t_nature uuid;
begin
  select id into uid from auth.users order by created_at limit 1;
  if uid is null then
    raise exception 'No user found. Sign in with Google once, then run this seed.';
  end if;

  delete from public.albums where user_id = uid and title in
    ('KKN', 'Dieng Trip', 'Hiking Merbabu', 'Anniversary', 'Surabaya');
  delete from public.tags where user_id = uid and name in ('travel','friends','love','nature');

  insert into public.tags (user_id, name) values (uid,'travel') returning id into t_travel;
  insert into public.tags (user_id, name) values (uid,'friends') returning id into t_friends;
  insert into public.tags (user_id, name) values (uid,'love') returning id into t_love;
  insert into public.tags (user_id, name) values (uid,'nature') returning id into t_nature;

  insert into public.albums (user_id, title, description, cover_image, location, latitude, longitude, date)
  values (uid, 'KKN', '45 days in a village that started as strangers and ended as family.',
          'https://picsum.photos/seed/kkn-cover/1600/1000', 'Kulon Progo, Yogyakarta', -7.8262, 110.1640, '2025-07-14')
  returning id into a_kkn;

  insert into public.albums (user_id, title, description, cover_image, location, latitude, longitude, date)
  values (uid, 'Dieng Trip', 'Golden sunrise above the clouds at Sikunir, 3 a.m. and worth it.',
          'https://picsum.photos/seed/dieng-cover/1600/1000', 'Dieng, Wonosobo', -7.2044, 109.9095, '2025-01-18')
  returning id into a_dieng;

  insert into public.albums (user_id, title, description, cover_image, location, latitude, longitude, date)
  values (uid, 'Hiking Merbabu', 'Two days, sore legs, and the best view either of us has ever seen.',
          'https://picsum.photos/seed/hike-cover/1600/1000', 'Gunung Merbabu', -7.4547, 110.4402, '2025-05-03')
  returning id into a_hike;

  insert into public.albums (user_id, title, description, cover_image, location, latitude, longitude, date)
  values (uid, 'Anniversary', 'One year. Dinner by the river, and the rain waited for us.',
          'https://picsum.photos/seed/anniv-cover/1600/1000', 'Yogyakarta', -7.7956, 110.3695, '2024-11-22')
  returning id into a_anniv;

  insert into public.albums (user_id, title, description, cover_image, location, latitude, longitude, date)
  values (uid, 'Surabaya', 'A weekend of heat, heritage, and too much food.',
          'https://picsum.photos/seed/sby-cover/1600/1000', 'Surabaya', -7.2575, 112.7521, '2024-08-09')
  returning id into a_sby;

  insert into public.album_tags (album_id, tag_id) values
    (a_kkn, t_friends), (a_dieng, t_travel), (a_dieng, t_nature),
    (a_hike, t_nature), (a_hike, t_love), (a_anniv, t_love), (a_sby, t_travel);

  insert into public.favorites (user_id, album_id) values (uid, a_dieng), (uid, a_anniv);

  -- Photos: varied portrait/landscape so the collage engine has range.
  insert into public.photos (album_id, user_id, storage_path, url, width, height, is_favorite, size_bytes)
  select a.album_id, uid, 'seed/' || a.seed, 'https://picsum.photos/seed/' || a.seed || '/' || a.w || '/' || a.h,
         a.w, a.h, a.fav, 350000
  from (values
    (a_kkn,'kkn1',1600,1067,true),(a_kkn,'kkn2',1000,1500,false),(a_kkn,'kkn3',1600,1067,false),
    (a_kkn,'kkn4',1200,1200,false),(a_kkn,'kkn5',1000,1400,true),(a_kkn,'kkn6',1600,1000,false),
    (a_kkn,'kkn7',1400,1000,false),(a_kkn,'kkn8',1000,1500,false),(a_kkn,'kkn9',1600,1067,false),
    (a_kkn,'kkn10',1200,1600,false),(a_kkn,'kkn11',1600,1067,false),(a_kkn,'kkn12',1100,1100,false),
    (a_dieng,'dg1',1600,1000,true),(a_dieng,'dg2',1000,1500,false),(a_dieng,'dg3',1600,1067,true),
    (a_dieng,'dg4',1200,1600,false),(a_dieng,'dg5',1600,1067,false),(a_dieng,'dg6',1000,1400,false),
    (a_dieng,'dg7',1600,1000,false),(a_dieng,'dg8',1200,1200,false),
    (a_hike,'hk1',1600,1067,false),(a_hike,'hk2',1000,1500,true),(a_hike,'hk3',1600,1000,false),
    (a_hike,'hk4',1200,1600,false),(a_hike,'hk5',1600,1067,false),(a_hike,'hk6',1100,1100,false),
    (a_anniv,'an1',1600,1067,true),(a_anniv,'an2',1000,1500,false),(a_anniv,'an3',1200,1200,false),
    (a_anniv,'an4',1600,1000,false),(a_anniv,'an5',1000,1400,true),
    (a_sby,'sb1',1600,1067,false),(a_sby,'sb2',1000,1500,false),(a_sby,'sb3',1600,1000,false),
    (a_sby,'sb4',1200,1600,false),(a_sby,'sb5',1600,1067,false)
  ) as a(album_id, seed, w, h, fav);
end $$;
