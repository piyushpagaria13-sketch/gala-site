-- Complimentary-ticket recipients — the real Class of 2027 list.
-- Requires 05_student_names.sql. Re-runnable: upserts on
-- (official_name, family_name), so edits here overwrite earlier runs.
--
-- Sample rows (no family_name) stay in the table for older tests but
-- never receive complimentary tickets.

create unique index if not exists students_official_family_key
  on students (official_name, family_name);

insert into students (name, grade, comp_seats, preferred_name, official_name, family_name) values
  ('Anastasia BAKURIYA', '12', 2, 'Anastasia', 'Anastasia', 'BAKURIYA'),
  ('Melo NKAMBULE', '12', 2, 'Melo', 'Simelokuhle', 'NKAMBULE'),
  ('Asep PUTRA', '12', 2, 'Asep', 'Asep', 'PUTRA'),
  ('Millie AM', '12', 2, 'Millie', 'Kanha', 'AM'),
  ('Roman AJAPNGU NJENDE', '12', 2, 'Roman', 'Roman', 'AJAPNGU NJENDE'),
  ('Christ Mignon AKOUYA-A', '12', 2, 'Christ Mignon', 'Christ Mignon', 'AKOUYA-A'),
  ('Nayelhi GOMEZ GARCIA', '12', 2, 'Nayelhi', 'Sara', 'GOMEZ GARCIA'),
  ('Benicio DELGADO MONTERO', '12', 2, 'Benicio', 'Benicio', 'DELGADO MONTERO'),
  ('Zoe Alejandra DIAZ PAYANO', '12', 2, 'Zoe Alejandra', 'Zoe Alejandra', 'DIAZ PAYANO'),
  ('Gabriel HERNANDEZ SOLIS', '12', 2, 'Gabriel', 'Gabriel', 'HERNANDEZ SOLIS'),
  ('Alexander LI', '12', 2, 'Alexander', 'Alexander', 'LI'),
  ('Kudzaishe Sewereni NKHATA', '12', 2, 'Kudzaishe Sewereni', 'Kudzaishe Sewereni', 'NKHATA'),
  ('Naw Ehka NORK', '12', 2, 'Naw Ehka', 'Naw Ehka', 'NORK'),
  ('Phetegue Abdoul Malick MEITE', '12', 2, 'Phetegue Abdoul Malick', 'Phetegue Abdoul Malick', 'MEITE'),
  ('Anastasia ZAPSA', '12', 2, 'Anastasia', 'Anastasia', 'ZAPSA'),
  ('Mareb OCHIENG', '12', 2, 'Mareb', 'Mareb', 'OCHIENG'),
  ('Alesia Samikai DIAZ DE LA VEGA GUERRERO', '12', 2, 'Alesia Samikai', 'Alesia Samikai', 'DIAZ DE LA VEGA GUERRERO'),
  ('Kingyel Wangchuk DORJI', '12', 2, 'Kingyel Wangchuk', 'Kingyel Wangchuk', 'DORJI'),
  ('Lautaro Gabriel PEREZ MARTINEZ', '12', 2, 'Lautaro Gabriel', 'Lautaro Gabriel', 'PEREZ MARTINEZ'),
  ('Chanhong YAIM', '12', 2, 'Chanhong', 'Chanhong', 'YAIM'),
  ('Emmanuel SORO', '12', 2, 'Emmanuel', 'Emmanuel', 'SORO'),
  ('Butter TRIEU', '12', 2, 'Butter', 'Khanh Ngan', 'TRIEU'),
  ('Mina June ANDRAULT CRUBEZY', '12', 2, 'Mina June', 'Mina June', 'ANDRAULT CRUBEZY'),
  ('Luka PECANAC', '12', 2, 'Luka', 'Luka', 'PECANAC'),
  ('Sofiia VENCHAK', '12', 2, 'Sofiia', 'Sofiia', 'VENCHAK')
on conflict (official_name, family_name) do update set
  name = excluded.name,
  grade = excluded.grade,
  comp_seats = excluded.comp_seats,
  preferred_name = excluded.preferred_name;

-- Sample rows are the ones without a family_name.
update students
set comp_seats = 0
where family_name is null;
