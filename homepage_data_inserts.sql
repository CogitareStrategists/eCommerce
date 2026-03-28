--
-- PostgreSQL database dump
--

-- Dumped from database version 16.12 (Debian 16.12-1.pgdg13+1)
-- Dumped by pg_dump version 16.12 (Debian 16.12-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: ecommerce
--



--
-- Data for Name: collections; Type: TABLE DATA; Schema: public; Owner: ecommerce
--

INSERT INTO public.collections VALUES ('e8e72932-6a28-4ca0-9bfc-87ab8720adff', 'Wellness', 'wellness', 'https://placehold.co/600x400', true);
INSERT INTO public.collections VALUES ('f648827b-7645-4a1f-92f8-bab3c54d4622', 'Fitness', 'fitness', 'https://placehold.co/600x400', true);
INSERT INTO public.collections VALUES ('813892d0-f774-4802-b818-9489f9b3dab6', 'Skin Care', 'skin-care', 'https://placehold.co/600x400', true);
INSERT INTO public.collections VALUES ('42540bc8-3fa1-495f-b3b8-e37fa4fb64da', 'Daily Need', 'daily-need', 'https://placehold.co/600x400', true);


--
-- Data for Name: concerns; Type: TABLE DATA; Schema: public; Owner: ecommerce
--

INSERT INTO public.concerns VALUES ('1e913639-b511-4320-8bf2-1e7a3e098375', 'Sleep', 'https://placehold.co/600x400', 'concern=sleep', true, false, 0);
INSERT INTO public.concerns VALUES ('fc77ede7-0049-4070-a657-9f6e4673e998', 'Immunity', 'https://placehold.co/600x400', 'concern=immunity', true, false, 0);
INSERT INTO public.concerns VALUES ('099b7a56-9cdf-4a66-86fd-21b3954512a5', 'Digestion', 'https://placehold.co/600x400', 'concern=digestion', true, false, 0);
INSERT INTO public.concerns VALUES ('52547082-e00c-47b8-86b0-a32de00e2174', 'Constipation', 'Placeholder.co', 'concern=constipation', true, false, 0);


--
-- Data for Name: home_sections; Type: TABLE DATA; Schema: public; Owner: ecommerce
--

INSERT INTO public.home_sections VALUES ('0ca1b206-4f5d-4779-b722-3fdb84adf27c', 'hero', 'Hero', true, 1);
INSERT INTO public.home_sections VALUES ('f16d9b73-0660-4735-9cf8-96e7874c5ab1', 'collections', 'Collections', true, 2);
INSERT INTO public.home_sections VALUES ('05878999-fc56-45bc-af67-f7442c2b15da', 'popular_products', 'Most Popular Products', true, 3);
INSERT INTO public.home_sections VALUES ('6b3e9300-6672-4f46-8148-3fe582d2ffe6', 'for_who_you_are', 'For Who You Are', true, 4);
INSERT INTO public.home_sections VALUES ('d8adef16-1efe-45b4-833a-59f90ab8a764', 'all_products', 'All Products', true, 5);
INSERT INTO public.home_sections VALUES ('c2799b5b-30fe-4efe-874d-e1feff413a63', 'cure_your_concerns', 'Cure Your Concerns', true, 6);
INSERT INTO public.home_sections VALUES ('6dc28627-ebd2-4c32-bc4c-5de516ef5daa', 'videos', 'Videos', true, 7);
INSERT INTO public.home_sections VALUES ('9afd518d-1d59-4b53-9f6d-29b66536ef35', 'testimonials', 'Testimonials', true, 8);


--
-- Data for Name: home_section_items; Type: TABLE DATA; Schema: public; Owner: ecommerce
--

INSERT INTO public.home_section_items VALUES ('4062874e-6008-4fd1-83bb-bed60a84b312', '05878999-fc56-45bc-af67-f7442c2b15da', 'product', 'dc8cc499-e8e2-44a4-81c7-d73da7212f2d', 1, true);
INSERT INTO public.home_section_items VALUES ('fb7dcc62-41e2-450d-b37b-e6994ca96a54', '05878999-fc56-45bc-af67-f7442c2b15da', 'product', 'f63abd18-e81f-4502-bb72-30fb2f90ed5f', 2, true);
INSERT INTO public.home_section_items VALUES ('0b320512-23f2-4e22-b615-e270dbf495f8', '05878999-fc56-45bc-af67-f7442c2b15da', 'product', 'c51c47b5-4982-4530-bd23-a556a7f08f93', 3, true);
INSERT INTO public.home_section_items VALUES ('c99bda4d-d0a1-43e0-8606-4fce2c8e4d49', 'd8adef16-1efe-45b4-833a-59f90ab8a764', 'product', 'f0774d99-d3fd-4c8e-9620-e8f0985d9b0b', 1, true);
INSERT INTO public.home_section_items VALUES ('c4ac0f1e-0c42-45a5-ad38-cfd67e61c60d', 'd8adef16-1efe-45b4-833a-59f90ab8a764', 'product', 'f63abd18-e81f-4502-bb72-30fb2f90ed5f', 2, true);
INSERT INTO public.home_section_items VALUES ('ca3c273f-43b0-411b-8377-94697b8e8722', 'd8adef16-1efe-45b4-833a-59f90ab8a764', 'product', 'f02b3d18-e916-437b-a707-0b7fd8bb3fc3', 3, true);
INSERT INTO public.home_section_items VALUES ('da3e5177-d217-4865-bdb0-4e200bf55f24', 'd8adef16-1efe-45b4-833a-59f90ab8a764', 'product', 'dc8cc499-e8e2-44a4-81c7-d73da7212f2d', 4, true);
INSERT INTO public.home_section_items VALUES ('aa4af7fb-e87f-4c1c-867e-648d864cd76e', 'd8adef16-1efe-45b4-833a-59f90ab8a764', 'product', 'c51c47b5-4982-4530-bd23-a556a7f08f93', 5, true);
INSERT INTO public.home_section_items VALUES ('ab270c37-0770-4957-88a3-99267c6b5621', '6dc28627-ebd2-4c32-bc4c-5de516ef5daa', 'video', '1744fb41-504e-4ad0-bc11-95a557afb352', 1, true);
INSERT INTO public.home_section_items VALUES ('2370cad9-f586-47a6-aa70-d2835bb3e681', '6dc28627-ebd2-4c32-bc4c-5de516ef5daa', 'video', '29e615f2-ed0e-40f4-adda-411d5b840322', 2, true);
INSERT INTO public.home_section_items VALUES ('cd33facd-006c-4792-9925-e1bc771ca5ce', '9afd518d-1d59-4b53-9f6d-29b66536ef35', 'testimonial', '0e6d9226-66b1-4cb5-b599-2790b19a54b6', 1, true);
INSERT INTO public.home_section_items VALUES ('fccd6183-3734-4a65-86f1-575accbe8fea', '9afd518d-1d59-4b53-9f6d-29b66536ef35', 'testimonial', '4435d9b5-a378-4b29-8f4e-cb088d1b85cc', 2, true);
INSERT INTO public.home_section_items VALUES ('44fc6aa2-5376-4af7-9607-59b789e7f408', 'f16d9b73-0660-4735-9cf8-96e7874c5ab1', 'collection', '42540bc8-3fa1-495f-b3b8-e37fa4fb64da', 1, true);
INSERT INTO public.home_section_items VALUES ('277ea049-07fb-4614-a451-eea5e0c2a062', 'f16d9b73-0660-4735-9cf8-96e7874c5ab1', 'collection', '813892d0-f774-4802-b818-9489f9b3dab6', 3, true);
INSERT INTO public.home_section_items VALUES ('dd95f9a2-81db-443d-b775-df1553c77bcb', 'f16d9b73-0660-4735-9cf8-96e7874c5ab1', 'collection', 'e8e72932-6a28-4ca0-9bfc-87ab8720adff', 4, true);
INSERT INTO public.home_section_items VALUES ('4cf4578d-6a66-44b7-bdf5-fb665ba23f0d', 'c2799b5b-30fe-4efe-874d-e1feff413a63', 'concern', '099b7a56-9cdf-4a66-86fd-21b3954512a5', 1, true);
INSERT INTO public.home_section_items VALUES ('5842a573-5cf9-48bf-8728-540d4caccda2', 'c2799b5b-30fe-4efe-874d-e1feff413a63', 'concern', 'fc77ede7-0049-4070-a657-9f6e4673e998', 2, true);
INSERT INTO public.home_section_items VALUES ('719a2d21-3cf9-4055-946d-9689c0b5da5b', 'c2799b5b-30fe-4efe-874d-e1feff413a63', 'concern', '1e913639-b511-4320-8bf2-1e7a3e098375', 3, true);
INSERT INTO public.home_section_items VALUES ('24b767ea-4116-40a4-b7f7-3ed13642a72c', 'c2799b5b-30fe-4efe-874d-e1feff413a63', 'concern', '52547082-e00c-47b8-86b0-a32de00e2174', 4, true);
INSERT INTO public.home_section_items VALUES ('7f2bb1ce-e28a-4197-8bef-acefac75b1c2', '6b3e9300-6672-4f46-8148-3fe582d2ffe6', 'persona', '41e232b1-9de8-4d67-a2c5-21cfc12274eb', 1, true);
INSERT INTO public.home_section_items VALUES ('8a6efa5d-974d-4139-95a2-edeaf70683e0', '6b3e9300-6672-4f46-8148-3fe582d2ffe6', 'persona', '759a2e48-d988-4fae-8073-747689dee6d0', 2, true);
INSERT INTO public.home_section_items VALUES ('649874ae-2c92-4b73-96a3-d8f7328c2c66', '6b3e9300-6672-4f46-8148-3fe582d2ffe6', 'persona', '22e2c29c-2611-4ece-b387-cb39a071d1fd', 3, true);
INSERT INTO public.home_section_items VALUES ('81713a6d-0b8e-4c63-8761-2b1e2b62657c', '6b3e9300-6672-4f46-8148-3fe582d2ffe6', 'persona', '2e4a2480-1389-4d29-ad8c-7dc2e2da569e', 4, true);


--
-- Data for Name: personas; Type: TABLE DATA; Schema: public; Owner: ecommerce
--

INSERT INTO public.personas VALUES ('41e232b1-9de8-4d67-a2c5-21cfc12274eb', 'For Busy Professionals', 'https://placehold.co/600x400', 'who=busy_professionals', true, false, 0);
INSERT INTO public.personas VALUES ('759a2e48-d988-4fae-8073-747689dee6d0', 'For Fitness Lovers', 'https://placehold.co/600x400', 'who=fitness_lovers', true, false, 0);
INSERT INTO public.personas VALUES ('22e2c29c-2611-4ece-b387-cb39a071d1fd', 'For Students', 'https://placehold.co/600x400', 'who=students', true, false, 0);
INSERT INTO public.personas VALUES ('2e4a2480-1389-4d29-ad8c-7dc2e2da569e', 'Elderly', 'www.placeholder.co', 'Elders', true, false, 0);


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: ecommerce
--

INSERT INTO public.products VALUES ('f02b3d18-e916-437b-a707-0b7fd8bb3fc3', 'Product C', 'product-c', 149.00, true, NULL, NULL, NULL, NULL, NULL, '2026-02-23 12:54:41.23539+00', '2026-02-23 12:54:41.23539+00', NULL);
INSERT INTO public.products VALUES ('dc8cc499-e8e2-44a4-81c7-d73da7212f2d', 'Product D', 'product-d', 399.00, true, NULL, NULL, NULL, NULL, NULL, '2026-02-23 12:54:41.23539+00', '2026-02-23 12:54:41.23539+00', NULL);
INSERT INTO public.products VALUES ('c51c47b5-4982-4530-bd23-a556a7f08f93', 'Product E', 'product-e', 249.00, true, NULL, NULL, NULL, NULL, NULL, '2026-02-23 12:54:41.23539+00', '2026-02-23 12:54:41.23539+00', NULL);
INSERT INTO public.products VALUES ('f0774d99-d3fd-4c8e-9620-e8f0985d9b0b', 'Product A', 'product-a', 199.00, true, NULL, '', '', '', '', '2026-02-23 12:54:41.23539+00', '2026-03-24 08:39:53.35079+00', 'e8e72932-6a28-4ca0-9bfc-87ab8720adff');
INSERT INTO public.products VALUES ('f63abd18-e81f-4502-bb72-30fb2f90ed5f', 'Product B', 'product-b', 299.00, true, NULL, '', '', '', '', '2026-02-23 12:54:41.23539+00', '2026-03-26 05:38:14.457097+00', 'e8e72932-6a28-4ca0-9bfc-87ab8720adff');


--
-- Data for Name: product_concerns; Type: TABLE DATA; Schema: public; Owner: ecommerce
--

INSERT INTO public.product_concerns VALUES ('f63abd18-e81f-4502-bb72-30fb2f90ed5f', '52547082-e00c-47b8-86b0-a32de00e2174');


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: ecommerce
--

INSERT INTO public.product_images VALUES ('1026fb84-810f-476c-a25d-3ee9c2815fea', 'f0774d99-d3fd-4c8e-9620-e8f0985d9b0b', 'https://plus.unsplash.com/premium_photo-1754752265556-77115945cde2?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 0, false);


--
-- Data for Name: product_personas; Type: TABLE DATA; Schema: public; Owner: ecommerce
--

INSERT INTO public.product_personas VALUES ('f63abd18-e81f-4502-bb72-30fb2f90ed5f', '2e4a2480-1389-4d29-ad8c-7dc2e2da569e');


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: ecommerce
--

INSERT INTO public.product_variants VALUES ('2dce7418-37be-459b-9967-e4f25f791c95', 'f0774d99-d3fd-4c8e-9620-e8f0985d9b0b', '100 gms', 100.00, 10.00, 20, NULL, true, '2026-02-23 14:01:04.209575+00', '2026-03-25 04:44:48.15482+00');
INSERT INTO public.product_variants VALUES ('cf74f222-36b7-4ae1-a858-5808cb1f6a5b', 'f0774d99-d3fd-4c8e-9620-e8f0985d9b0b', '250 gms', 250.00, 15.00, 10, NULL, true, '2026-03-25 04:35:50.738205+00', '2026-03-25 04:44:52.24904+00');


--
-- Data for Name: testimonials; Type: TABLE DATA; Schema: public; Owner: ecommerce
--

INSERT INTO public.testimonials VALUES ('0e6d9226-66b1-4cb5-b599-2790b19a54b6', 'Asha', 5, 'Amazing experience and quick delivery!', true, false, 0);
INSERT INTO public.testimonials VALUES ('4435d9b5-a378-4b29-8f4e-cb088d1b85cc', 'Rahul', 4, 'Good quality. Will buy again.', true, false, 0);


--
-- Data for Name: videos; Type: TABLE DATA; Schema: public; Owner: ecommerce
--

INSERT INTO public.videos VALUES ('1744fb41-504e-4ad0-bc11-95a557afb352', 'How it works (YouTube)', 'youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://placehold.co/600x400', true, false, 0);
INSERT INTO public.videos VALUES ('29e615f2-ed0e-40f4-adda-411d5b840322', 'Instagram Reel', 'instagram', 'https://www.instagram.com/reel/EXAMPLE', 'https://placehold.co/600x400', true, false, 0);


--
-- PostgreSQL database dump complete
--

