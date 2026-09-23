"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type Question = {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

const questionBank: Question[] = [
  {
    id: 1,
    question: 'According to the Devi Mahatmya, which demon is defeated by Goddess Durga?',
    options: ['Mahishasura', 'Ravana', 'Kamsa', 'Hiranyakashipu'],
    answer: 0,
    explanation: "Durga's battle with Mahishasura is the central victory celebrated in the Devi Mahatmya.",
  },
  {
    id: 2,
    question: 'What form does Mahishasura famously take during his battle with Durga?',
    options: ['Buffalo', 'Lion', 'Elephant', 'Horse'],
    answer: 0,
    explanation: 'Mahishasura is famously described as a buffalo demon who changes forms.',
  },
  {
    id: 3,
    question: 'Why was Mahishasura difficult for the gods to defeat in the traditional story?',
    options: ['He had a boon protecting him from male beings', 'He was invisible at night', 'He could control the oceans', 'He possessed the Sudarshana Chakra'],
    answer: 0,
    explanation: 'In a popular account, Mahishasura had a boon that made him invulnerable to male beings.',
  },
  {
    id: 4,
    question: 'Who created the divine form of Durga in the Devi Mahatmya tradition?',
    options: ['The combined divine powers of the gods', 'Only Shiva', 'Only Vishnu', 'Only Brahma'],
    answer: 0,
    explanation: 'The gods combined their energies to manifest the powerful Goddess.',
  },
  {
    id: 5,
    question: "Which weapon is especially associated with Shiva's gift to Durga?",
    options: ['Trident', 'Sudarshana Chakra', 'Vajra', 'Gada'],
    answer: 0,
    explanation: 'Shiva is traditionally associated with giving Durga the trident.',
  },
  {
    id: 6,
    question: "Which weapon is traditionally associated with Vishnu's gift to Durga?",
    options: ['Sudarshana Chakra', 'Trident', 'Pashupatastra', 'Parashu'],
    answer: 0,
    explanation: "Vishnu's discus, the Sudarshana Chakra, is among the divine weapons associated with Durga.",
  },
  {
    id: 7,
    question: "Which animal is traditionally depicted as Maa Durga's mount?",
    options: ['Lion', 'Peacock', 'Owl', 'Swan'],
    answer: 0,
    explanation: 'Durga is commonly depicted riding a lion; some traditions depict a tiger.',
  },
  {
    id: 8,
    question: 'How many arms is Maa Durga commonly shown with in popular iconography?',
    options: ['Ten', 'Two', 'Four', 'Eighteen'],
    answer: 0,
    explanation: 'Ten-armed Durga is one of the most familiar forms in Durga Puja iconography.',
  },
  {
    id: 9,
    question: 'Which goddess is often identified as a fierce manifestation of the Divine Mother?',
    options: ['Kali', 'Saraswati', 'Lakshmi', 'Ganga'],
    answer: 0,
    explanation: 'Kali is widely regarded in Shakta traditions as a fierce form or manifestation of the Goddess.',
  },
  {
    id: 10,
    question: "What does the name 'Mahishasuramardini' mean?",
    options: ['The slayer of Mahishasura', 'Mother of Mahishasura', 'Queen of the mountains', 'Goddess of learning'],
    answer: 0,
    explanation: 'Mahishasuramardini means the Goddess who defeated or slew Mahishasura.',
  },
  {
    id: 11,
    question: "Which text contains the famous account of Durga's battle with Mahishasura?",
    options: ['Devi Mahatmya', 'Ramcharitmanas', 'Arthashastra', 'Yoga Sutras'],
    answer: 0,
    explanation: 'The Devi Mahatmya contains the celebrated Mahishasura episode.',
  },
  {
    id: 12,
    question: 'The Devi Mahatmya is traditionally part of which larger scripture?',
    options: ['Markandeya Purana', 'Vishnu Purana', 'Shiva Purana', 'Bhagavata Purana'],
    answer: 0,
    explanation: 'The Devi Mahatmya is a section of the Markandeya Purana.',
  },
  {
    id: 13,
    question: 'Which festival is closely associated with the worship of Durga in Bengal?',
    options: ['Durga Puja', 'Holi', 'Onam', 'Baisakhi'],
    answer: 0,
    explanation: 'Durga Puja is one of the major festivals dedicated to Goddess Durga in Bengal.',
  },
  {
    id: 14,
    question: 'What is another well-known name for Durga as the Mother of the universe?',
    options: ['Jagadamba', 'Dhanvantari', 'Garuda', 'Nandi'],
    answer: 0,
    explanation: 'Jagadamba is a traditional epithet meaning Mother of the world.',
  },
  {
    id: 15,
    question: "Which demon is associated with the Goddess's victory in the Devi Mahatmya's first major battle?",
    options: ['Madhu and Kaitabha', 'Bhasmasura', 'Bali', 'Vritra'],
    answer: 0,
    explanation: "Madhu and Kaitabha appear in an earlier episode of the Devi Mahatmya involving the Goddess's power.",
  },
  {
    id: 16,
    question: "Who is traditionally described as Durga's consort?",
    options: ['Shiva', 'Vishnu', 'Indra', 'Agni'],
    answer: 0,
    explanation: "Durga is a form of Parvati in many traditions, and Parvati is Shiva's consort.",
  },
  {
    id: 17,
    question: "What is Parvati's relationship to Himavan in the traditional story?",
    options: ['She is his daughter', 'She is his sister', 'She is his mother', 'She is his wife'],
    answer: 0,
    explanation: 'Parvati is traditionally described as the daughter of Himavan, the personified Himalayas.',
  },
  {
    id: 18,
    question: 'What does the name Parvati literally relate to?',
    options: ['Mountain', 'River', 'Fire', 'Moon'],
    answer: 0,
    explanation: "Parvati's name is connected with the Sanskrit word for mountain, reflecting her association with the Himalayas.",
  },
  {
    id: 19,
    question: 'Which Goddess is commonly associated with the power of speech, learning and music?',
    options: ['Saraswati', 'Lakshmi', 'Kali', 'Shitala'],
    answer: 0,
    explanation: 'Saraswati is traditionally associated with learning, speech, music and the arts.',
  },
  {
    id: 20,
    question: 'Which Goddess is commonly associated with wealth and prosperity?',
    options: ['Lakshmi', 'Saraswati', 'Ganga', 'Kali'],
    answer: 0,
    explanation: 'Lakshmi is traditionally associated with prosperity, abundance and good fortune.',
  },
  {
    id: 21,
    question: "What is the name of Shiva's divine bow in many Hindu traditions?",
    options: ['Pinaka', 'Gandiva', 'Sharanga', 'Kodanda'],
    answer: 0,
    explanation: 'Pinaka is the bow traditionally associated with Shiva.',
  },
  {
    id: 22,
    question: "What is Shiva's famous three-pronged weapon called?",
    options: ['Trishula', 'Vajra', 'Chakra', 'Brahmastra'],
    answer: 0,
    explanation: "Shiva's trident is called the Trishula.",
  },
  {
    id: 23,
    question: "What is the name of Shiva's sacred bull?",
    options: ['Nandi', 'Airavata', 'Garuda', 'Jatayu'],
    answer: 0,
    explanation: "Nandi is Shiva's bull and devoted attendant.",
  },
  {
    id: 24,
    question: "Which river is traditionally said to have descended from heaven through Shiva's matted hair?",
    options: ['Ganga', 'Yamuna', 'Godavari', 'Narmada'],
    answer: 0,
    explanation: 'The descent of the Ganga is traditionally connected with Shiva receiving the river in his matted locks.',
  },
  {
    id: 25,
    question: 'Why did Shiva receive the force of the descending Ganga in the traditional story?',
    options: ['To prevent her descent from devastating the earth', 'To create an ocean', 'To defeat Mahishasura', 'To awaken Ganesha'],
    answer: 0,
    explanation: 'Shiva is said to have caught the powerful river in his hair before releasing it gently toward Earth.',
  },
  {
    id: 26,
    question: "What is the name of Shiva's third eye?",
    options: ['His eye of divine insight', 'His weapon of thunder', 'His crown jewel', 'His sacred drum'],
    answer: 0,
    explanation: "Shiva's third eye symbolizes divine insight and is associated with transformative power.",
  },
  {
    id: 27,
    question: 'Which drum is traditionally held by Shiva?',
    options: ['Damaru', 'Mridangam', 'Tabla', 'Pakhawaj'],
    answer: 0,
    explanation: 'The small hourglass-shaped damaru is closely associated with Shiva.',
  },
  {
    id: 28,
    question: "What does Shiva's Nataraja form represent?",
    options: ['The cosmic dance', 'The birth of Ganesha', 'The churning of the ocean', 'The battle with Ravana'],
    answer: 0,
    explanation: 'Nataraja is Shiva as Lord of the Cosmic Dance.',
  },
  {
    id: 29,
    question: "Who is Ganesha's mother in the most widely known tradition?",
    options: ['Parvati', 'Lakshmi', 'Saraswati', 'Ganga'],
    answer: 0,
    explanation: 'Ganesha is traditionally described as the son of Shiva and Parvati.',
  },
  {
    id: 30,
    question: 'Why does Ganesha have an elephant head in the famous story?',
    options: ['Shiva replaced his severed head', 'He was born with it from Brahma', 'He received it from Vishnu at birth', 'He transformed himself into an elephant'],
    answer: 0,
    explanation: "In the best-known story, Shiva replaced Ganesha's head with that of an elephant.",
  },
  {
    id: 31,
    question: "What is Ganesha's vehicle traditionally called?",
    options: ['Mouse or rat', 'Peacock', 'Lion', 'Swan'],
    answer: 0,
    explanation: "Ganesha's vahana is traditionally a mouse or rat, often called Mushika.",
  },
  {
    id: 32,
    question: "Which title of Ganesha means 'Lord of Hosts'?",
    options: ['Ganapati', 'Mahadeva', 'Nataraja', 'Vasudeva'],
    answer: 0,
    explanation: 'Ganapati is a traditional title meaning Lord of the ganas or groups.',
  },
  {
    id: 33,
    question: "Which title means 'Remover of Obstacles' and is commonly associated with Ganesha?",
    options: ['Vighnaharta', 'Neelkantha', 'Trilochana', 'Girija'],
    answer: 0,
    explanation: 'Vighnaharta is a popular epithet of Ganesha meaning remover of obstacles.',
  },
  {
    id: 34,
    question: 'Why is Ganesha traditionally worshipped before beginning an important undertaking?',
    options: ['He is invoked for the removal of obstacles', 'He controls the weather', 'He is the god of oceans', 'He guards Mount Kailash from all visitors'],
    answer: 0,
    explanation: 'Ganesha is traditionally invoked at beginnings because of his association with removing obstacles.',
  },
  {
    id: 35,
    question: "Which story is often told to explain Ganesha's wisdom?",
    options: ['He circled his parents instead of the world', 'He defeated Mahishasura', 'He carried Mount Meru', 'He swallowed the Ganga'],
    answer: 0,
    explanation: 'In a famous contest, Ganesha considered his parents to represent the world and circled them.',
  },
  {
    id: 36,
    question: "Who is Ganesha's brother in the widely known family tradition?",
    options: ['Kartikeya', 'Hanuman', 'Indra', 'Surya'],
    answer: 0,
    explanation: "Kartikeya is traditionally described as Ganesha's brother.",
  },
  {
    id: 37,
    question: 'Which festival is especially associated with public worship of Ganesha?',
    options: ['Ganesh Chaturthi', 'Navaratri', 'Janmashtami', 'Maha Shivaratri'],
    answer: 0,
    explanation: 'Ganesh Chaturthi is the major festival associated with Ganesha.',
  },
  {
    id: 38,
    question: 'What sweet is especially associated with Ganesha?',
    options: ['Modak', 'Payasam', 'Jalebi', 'Laddu'],
    answer: 0,
    explanation: 'Modak is especially associated with Ganesha and is often offered to him.',
  },
  {
    id: 39,
    question: "What is Ganesha's curved trunk commonly called in Sanskrit?",
    options: ['Vakratunda', 'Trinetra', 'Nilakantha', 'Kapardin'],
    answer: 0,
    explanation: "Vakratunda is a well-known epithet referring to Ganesha's curved trunk.",
  },
  {
    id: 40,
    question: 'Which deity is also known as Skanda?',
    options: ['Kartikeya', 'Ganesha', 'Shiva', 'Agni'],
    answer: 0,
    explanation: 'Skanda is one of the traditional names of Kartikeya.',
  },
  {
    id: 41,
    question: 'Which bird is traditionally associated with Kartikeya as his mount?',
    options: ['Peacock', 'Swan', 'Owl', 'Eagle'],
    answer: 0,
    explanation: 'Kartikeya is traditionally depicted riding a peacock.',
  },
  {
    id: 42,
    question: 'What is another famous name for Kartikeya in South India?',
    options: ['Murugan', 'Vamana', 'Narasimha', 'Dhanvantari'],
    answer: 0,
    explanation: 'Murugan is a major name for Kartikeya, especially in Tamil traditions.',
  },
  {
    id: 43,
    question: 'Which demon is Kartikeya famously associated with defeating?',
    options: ['Tarakasura', 'Mahishasura', 'Ravana', 'Kumbhakarna'],
    answer: 0,
    explanation: 'Kartikeya is famously associated with defeating the demon Tarakasura.',
  },
  {
    id: 44,
    question: "What is the name of Kartikeya's spear?",
    options: ['Vel', 'Trishula', 'Gada', 'Pinaka'],
    answer: 0,
    explanation: 'The vel is the sacred spear strongly associated with Kartikeya or Murugan.',
  },
  {
    id: 45,
    question: 'How many heads is Kartikeya commonly depicted with in one famous form?',
    options: ['Six', 'Two', 'Four', 'Ten'],
    answer: 0,
    explanation: 'Shanmukha, a form of Kartikeya, is depicted with six faces.',
  },
  {
    id: 46,
    question: 'What does the name Shanmukha mean?',
    options: ['Six-faced', 'Three-eyed', 'Elephant-headed', 'Mountain-born'],
    answer: 0,
    explanation: 'Shanmukha literally refers to the six-faced form of Kartikeya.',
  },
  {
    id: 47,
    question: 'Which goddess is commonly depicted with an owl as her vehicle?',
    options: ['Lakshmi', 'Saraswati', 'Durga', 'Parvati'],
    answer: 0,
    explanation: 'Lakshmi is commonly associated with an owl as her vahana in several traditions.',
  },
  {
    id: 48,
    question: 'Which goddess is traditionally depicted with a swan or peacock and a veena?',
    options: ['Saraswati', 'Lakshmi', 'Kali', 'Durga'],
    answer: 0,
    explanation: 'Saraswati is commonly depicted with a veena and is associated with the swan or peacock.',
  },
  {
    id: 49,
    question: "What is the name of Saraswati's musical instrument?",
    options: ['Veena', 'Damaru', 'Mridangam', 'Flute'],
    answer: 0,
    explanation: "The veena is Saraswati's most familiar musical instrument.",
  },
  {
    id: 50,
    question: 'Which color is traditionally strongly associated with Saraswati worship?',
    options: ['White', 'Black', 'Red', 'Orange'],
    answer: 0,
    explanation: 'White clothing and imagery are strongly associated with Saraswati and the symbolism of knowledge and purity.',
  },
  {
    id: 51,
    question: 'Which deity is traditionally described as the preserver in the Hindu Trimurti?',
    options: ['Vishnu', 'Shiva', 'Brahma', 'Indra'],
    answer: 0,
    explanation: 'In the Trimurti, Vishnu is traditionally associated with preservation.',
  },
  {
    id: 52,
    question: 'Which deity is traditionally described as the creator in the Hindu Trimurti?',
    options: ['Brahma', 'Vishnu', 'Shiva', 'Ganesha'],
    answer: 0,
    explanation: 'In the Trimurti, Brahma is traditionally associated with creation.',
  },
  {
    id: 53,
    question: 'Which deity is traditionally described as the transformer or destroyer in the Hindu Trimurti?',
    options: ['Shiva', 'Vishnu', 'Brahma', 'Surya'],
    answer: 0,
    explanation: 'Shiva is traditionally associated with dissolution or transformation.',
  },
  {
    id: 54,
    question: "What does the word 'Devi' generally mean?",
    options: ['Goddess', 'King', 'Mountain', 'River'],
    answer: 0,
    explanation: 'Devi is a Sanskrit term commonly meaning goddess or divine feminine.',
  },
  {
    id: 55,
    question: "What does 'Shakti' generally refer to in Hindu traditions?",
    options: ['Divine power or energy', 'A sacred river', 'A temple bell', 'A musical scale'],
    answer: 0,
    explanation: 'Shakti commonly refers to divine power, energy or the feminine divine principle.',
  },
  {
    id: 56,
    question: 'What does Navaratri literally mean?',
    options: ['Nine nights', 'Nine days of fasting', 'Nine temples', 'Nine goddesses only'],
    answer: 0,
    explanation: 'Navaratri literally means nine nights.',
  },
  {
    id: 57,
    question: 'Which form of the Goddess is worshipped on the eighth day of Navaratri in many traditions?',
    options: ['Mahagauri', 'Shailaputri', 'Katyayani', 'Siddhidatri'],
    answer: 0,
    explanation: 'In one widely followed Navadurga sequence, Mahagauri is worshipped on the eighth day.',
  },
  {
    id: 58,
    question: 'Which form of the Goddess is traditionally associated with the first day of Navaratri?',
    options: ['Shailaputri', 'Kalaratri', 'Siddhidatri', 'Mahagauri'],
    answer: 0,
    explanation: 'Shailaputri is traditionally the first of the Navadurga forms in a common sequence.',
  },
  {
    id: 59,
    question: 'Which Navadurga form is associated with the seventh day?',
    options: ['Kalaratri', 'Brahmacharini', 'Kushmanda', 'Chandraghanta'],
    answer: 0,
    explanation: 'Kalaratri is traditionally worshipped on the seventh day in the Navadurga sequence.',
  },
  {
    id: 60,
    question: 'Which Navadurga form is associated with the ninth day?',
    options: ['Siddhidatri', 'Skandamata', 'Katyayani', 'Mahagauri'],
    answer: 0,
    explanation: 'Siddhidatri is traditionally the ninth Navadurga form in the common sequence.',
  },
  {
    id: 61,
    question: 'Who is Skandamata the mother of?',
    options: ['Kartikeya (Skanda)', 'Ganesha', 'Hanuman', 'Rama'],
    answer: 0,
    explanation: 'Skandamata is described as the mother of Skanda, another name for Kartikeya.',
  },
  {
    id: 62,
    question: 'Which Navadurga form is depicted holding the infant Skanda?',
    options: ['Skandamata', 'Katyayani', 'Brahmacharini', 'Kalaratri'],
    answer: 0,
    explanation: 'Skandamata is the motherly form shown with Skanda.',
  },
  {
    id: 63,
    question: 'Which form of Durga is famously associated with a lion and a crescent moon on her forehead?',
    options: ['Chandraghanta', 'Kushmanda', 'Siddhidatri', 'Mahagauri'],
    answer: 0,
    explanation: 'Chandraghanta is named for the crescent moon-shaped bell associated with her forehead.',
  },
  {
    id: 64,
    question: 'Which goddess is said in a popular tradition to have created the universe with her smile?',
    options: ['Kushmanda', 'Kalaratri', 'Skandamata', 'Siddhidatri'],
    answer: 0,
    explanation: 'Kushmanda is traditionally associated with creating the cosmic egg through her divine smile.',
  },
  {
    id: 65,
    question: 'What does the name Kushmanda traditionally refer to?',
    options: ['The cosmic creator associated with the cosmic egg', 'The slayer of Mahishasura', 'The mother of Ganesha', 'The river goddess'],
    answer: 0,
    explanation: 'Kushmanda is traditionally connected with the cosmic egg and creation.',
  },
  {
    id: 66,
    question: 'Which goddess is associated with severe penance before becoming Parvati?',
    options: ['Brahmacharini', 'Mahagauri', 'Katyayani', 'Skandamata'],
    answer: 0,
    explanation: 'Brahmacharini represents the Goddess in the form associated with austere penance.',
  },
  {
    id: 67,
    question: 'Which form of Durga is known for a fierce appearance and a dark complexion?',
    options: ['Kalaratri', 'Shailaputri', 'Chandraghanta', 'Siddhidatri'],
    answer: 0,
    explanation: 'Kalaratri is the fierce seventh form of the Navadurga.',
  },
  {
    id: 68,
    question: 'Which deity is traditionally said to have placed the crescent moon in his hair?',
    options: ['Shiva', 'Vishnu', 'Brahma', 'Ganesha'],
    answer: 0,
    explanation: 'Shiva is famously depicted with a crescent moon in his matted hair.',
  },
  {
    id: 69,
    question: "What is Shiva's abode traditionally called?",
    options: ['Mount Kailash', 'Mount Meru', 'Ayodhya', 'Vaikuntha'],
    answer: 0,
    explanation: "Mount Kailash is traditionally described as Shiva's abode.",
  },
  {
    id: 70,
    question: "What is Vishnu's traditional abode called?",
    options: ['Vaikuntha', 'Kailash', 'Lanka', 'Amaravati'],
    answer: 0,
    explanation: "Vaikuntha is traditionally described as Vishnu's divine abode.",
  },
  {
    id: 71,
    question: 'Which serpent is famously associated with Shiva?',
    options: ['Vasuki', 'Shesha', 'Takshaka', 'Kaliya'],
    answer: 0,
    explanation: "Vasuki is commonly depicted around Shiva's neck.",
  },
  {
    id: 72,
    question: 'Which serpent is especially associated with Vishnu as his cosmic serpent couch?',
    options: ['Shesha', 'Vasuki', 'Kaliya', 'Takshaka'],
    answer: 0,
    explanation: 'Shesha, also called Ananta, is traditionally associated with Vishnu.',
  },
  {
    id: 73,
    question: 'Who is traditionally known as the consort of Vishnu?',
    options: ['Lakshmi', 'Saraswati', 'Parvati', 'Ganga'],
    answer: 0,
    explanation: "Lakshmi is traditionally described as Vishnu's consort.",
  },
  {
    id: 74,
    question: 'Who is traditionally known as the consort of Brahma?',
    options: ['Saraswati', 'Lakshmi', 'Parvati', 'Ganga'],
    answer: 0,
    explanation: "Saraswati is traditionally associated as Brahma's consort in many traditions.",
  },
  {
    id: 75,
    question: 'Which avatar of Vishnu is depicted as half-man and half-lion?',
    options: ['Narasimha', 'Varaha', 'Vamana', 'Matsya'],
    answer: 0,
    explanation: 'Narasimha is the half-man, half-lion avatar of Vishnu.',
  },
  {
    id: 76,
    question: 'Which avatar of Vishnu is depicted as a boar?',
    options: ['Varaha', 'Kurma', 'Matsya', 'Parashurama'],
    answer: 0,
    explanation: 'Varaha is the boar avatar of Vishnu.',
  },
  {
    id: 77,
    question: 'Which avatar of Vishnu is associated with a dwarf Brahmin who took three steps?',
    options: ['Vamana', 'Rama', 'Krishna', 'Narasimha'],
    answer: 0,
    explanation: 'Vamana is the dwarf avatar who asks for three paces of land and then spans the universe.',
  },
  {
    id: 78,
    question: 'Which avatar of Vishnu is associated with the Ramayana?',
    options: ['Rama', 'Krishna', 'Varaha', 'Kurma'],
    answer: 0,
    explanation: 'Rama is the Vishnu avatar central to the Ramayana.',
  },
  {
    id: 79,
    question: "Who is traditionally described as Rama's devoted ally and devotee?",
    options: ['Hanuman', 'Jatayu', 'Sugriva', 'Vibhishana'],
    answer: 0,
    explanation: "Hanuman is one of Rama's most devoted allies and devotees.",
  },
  {
    id: 80,
    question: "Who is Hanuman's divine father traditionally said to be?",
    options: ['Vayu', 'Agni', 'Surya', 'Indra'],
    answer: 0,
    explanation: 'Hanuman is traditionally associated with Vayu, the wind deity, as his divine father.',
  },
  {
    id: 81,
    question: 'What did Hanuman famously carry to help Lakshmana?',
    options: ['The Sanjeevani-bearing mountain', 'Mount Kailash', 'The Sudarshana Chakra', 'The bow of Shiva'],
    answer: 0,
    explanation: 'In the famous Ramayana episode, Hanuman carries the mountain containing the life-restoring herb.',
  },
  {
    id: 82,
    question: 'Which goddess is traditionally described as the daughter of the ocean of milk in the churning story?',
    options: ['Lakshmi', 'Saraswati', 'Durga', 'Parvati'],
    answer: 0,
    explanation: 'Lakshmi emerges during the churning of the ocean of milk in a widely known tradition.',
  },
  {
    id: 83,
    question: 'What is the cosmic ocean churned by the gods and asuras called?',
    options: ['Kshira Sagara', 'Saraswati', 'Mandakini', 'Pushkara'],
    answer: 0,
    explanation: 'Kshira Sagara is the ocean of milk associated with the churning episode.',
  },
  {
    id: 84,
    question: 'Which mountain was used as the churning rod in the Samudra Manthana?',
    options: ['Mandara', 'Kailash', 'Meru', 'Vindhya'],
    answer: 0,
    explanation: 'Mandara mountain is traditionally used as the churning rod.',
  },
  {
    id: 85,
    question: 'Which serpent was used as the rope during the churning of the ocean?',
    options: ['Vasuki', 'Shesha', 'Kaliya', 'Takshaka'],
    answer: 0,
    explanation: 'Vasuki is traditionally used as the churning rope.',
  },
  {
    id: 86,
    question: 'Who consumed the deadly poison produced during the churning of the ocean?',
    options: ['Shiva', 'Vishnu', 'Brahma', 'Indra'],
    answer: 0,
    explanation: 'Shiva drank the poison to protect the worlds; it is associated with his blue throat.',
  },
  {
    id: 87,
    question: 'Why is Shiva called Neelkantha?',
    options: ['His throat became blue after consuming poison', 'He lives on a blue mountain', 'He wears a blue crown', 'His eyes are blue'],
    answer: 0,
    explanation: "Neelkantha means blue-throated, referring to Shiva's consumption of the deadly poison.",
  },
  {
    id: 88,
    question: 'Which goddess is traditionally associated with the lotus?',
    options: ['Lakshmi', 'Kali', 'Kalaratri', 'Shailaputri'],
    answer: 0,
    explanation: 'Lakshmi is strongly associated with the lotus in Hindu iconography.',
  },
  {
    id: 89,
    question: 'What does the lotus often symbolize in Hindu religious imagery?',
    options: ['Purity and spiritual emergence', 'War', 'Thunder', 'Fire'],
    answer: 0,
    explanation: 'The lotus commonly symbolizes purity and spiritual emergence because it rises from muddy water while remaining unstained.',
  },
  {
    id: 90,
    question: 'Which sacred bird is traditionally associated with Vishnu?',
    options: ['Garuda', 'Nandi', 'Mushika', 'Mayura'],
    answer: 0,
    explanation: "Garuda is Vishnu's traditional vehicle and divine eagle-like being.",
  },
  {
    id: 91,
    question: 'Which deity is traditionally associated with the thunderbolt weapon Vajra?',
    options: ['Indra', 'Shiva', 'Vishnu', 'Agni'],
    answer: 0,
    explanation: 'Indra is traditionally associated with the Vajra, his thunderbolt weapon.',
  },
  {
    id: 92,
    question: 'Who is the mother of Ganesha in the best-known family tradition?',
    options: ['Parvati', 'Lakshmi', 'Sita', 'Saraswati'],
    answer: 0,
    explanation: "Parvati is Ganesha's mother in the widely known tradition.",
  },
  {
    id: 93,
    question: 'Which deity is traditionally depicted with an elephant head and a single tusk?',
    options: ['Ganesha', 'Kartikeya', 'Shiva', 'Indra'],
    answer: 0,
    explanation: 'Ganesha is commonly depicted with an elephant head and one broken tusk.',
  },
  {
    id: 94,
    question: "What is Ganesha's single broken tusk traditionally called in descriptions of his iconography?",
    options: ['Ekadanta', 'Trinetra', 'Dashanana', 'Panchanana'],
    answer: 0,
    explanation: 'Ekadanta is an epithet of Ganesha meaning one-tusked.',
  },
  {
    id: 95,
    question: 'What does the name Ekadanta mean?',
    options: ['One-tusked', 'Eleven-headed', 'Three-eyed', 'Four-armed'],
    answer: 0,
    explanation: 'Ekadanta literally means one-tusked.',
  },
  {
    id: 96,
    question: 'Which festival is dedicated to Shiva and traditionally observed with night-long worship?',
    options: ['Maha Shivaratri', 'Janmashtami', 'Diwali', 'Vasant Panchami'],
    answer: 0,
    explanation: 'Maha Shivaratri is the major festival dedicated to Shiva and is traditionally observed through the night.',
  },
  {
    id: 97,
    question: 'Which festival is associated with Saraswati worship and learning?',
    options: ['Vasant Panchami', 'Onam', 'Raksha Bandhan', 'Holi'],
    answer: 0,
    explanation: 'Vasant Panchami is widely associated with Saraswati worship and learning.',
  },
  {
    id: 98,
    question: 'Which festival is strongly associated with Lakshmi worship in many parts of India?',
    options: ['Diwali', 'Holi', 'Janmashtami', 'Baisakhi'],
    answer: 0,
    explanation: 'Lakshmi Puja is an important part of Diwali celebrations in many traditions.',
  },
  {
    id: 99,
    question: 'In the popular Durga Puja story, who is the divine warrior goddess fighting Mahishasura?',
    options: ['Durga', 'Sita', 'Radha', 'Rukmini'],
    answer: 0,
    explanation: 'Durga is the warrior Goddess who defeats Mahishasura in the celebrated story.',
  },
  {
    id: 100,
    question: 'Which divine feminine principle is often understood as the dynamic power of Shiva?',
    options: ['Shakti', 'Maya only', 'Prakriti only', 'Veda'],
    answer: 0,
    explanation: 'Shakti is widely understood as divine power or energy and is especially associated with the Goddess.',
  },
];

export default function QuizPage() {
  const GAME_DURATION = 60;

  type AnsweredQuestion = {
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
  };

  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const shuffleOptions = (item: Question): Question => {
    const optionEntries = item.options
      .map((option, index) => ({
        option,
        isCorrect: index === item.answer,
      }))
      .sort(() => Math.random() - 0.5);

    return {
      ...item,
      options: optionEntries.map((entry) => entry.option),
      answer: optionEntries.findIndex((entry) => entry.isCorrect),
    };
  };

  const createGame = () => {
    const shuffled = [...questionBank].sort(() => Math.random() - 0.5);
    setGameQuestions(shuffled.map(shuffleOptions));
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnsweredQuestions([]);
    setTimeLeft(GAME_DURATION);
    setGameStarted(false);
    setGameOver(false);
  };

  useEffect(() => {
    createGame();
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setGameOver(true);
          setSelectedAnswer(null);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [gameStarted, gameOver]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnsweredQuestions([]);
  };

  const question = gameQuestions[currentQuestion];

  const selectAnswer = (index: number) => {
    if (!question || selectedAnswer !== null || gameOver) return;

    const isCorrect = index === question.answer;

    setSelectedAnswer(index);

    setAnsweredQuestions((previous) => [
      ...previous,
      {
        question: question.question,
        selectedAnswer: question.options[index],
        correctAnswer: question.options[question.answer],
      },
    ]);

    if (isCorrect) {
      setScore((value) => value + 1);
    }

    window.setTimeout(() => {
      setCurrentQuestion((value) => value + 1);
      setSelectedAnswer(null);
    }, 180);
  };

  const progress = ((GAME_DURATION - timeLeft) / GAME_DURATION) * 100;
  const answeredCount = answeredQuestions.length;
  const wrongAnswers = answeredQuestions.filter(
    (item) => item.selectedAnswer !== item.correctAnswer
  );

  const getScoreMessage = () => {
    if (score >= 15) return "Amazing! Your mythology knowledge is impressive.";
    if (score >= 10) return "Fantastic! You are quick with your mythology.";
    if (score >= 6) return "Well played! Try again and beat your score.";
    return "Good try! Can you answer more next time?";
  };

  return (
    <main className="min-h-screen bg-[#f8f1e7] font-sans text-[#241b17]">
      <div className="relative z-30 mx-auto -mt-2 mb-3 w-full max-w-7xl rounded-2xl border border-[#ead8bd]/70 bg-[#fffaf2]/95 shadow-[0_8px_30px_rgba(120,70,20,0.08)] backdrop-blur-sm max-[600px]:rounded-xl">
        <Navbar />
      </div>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_center,_#fffaf0_0%,_#f7ead8_55%,_#ecd3b0_100%)] px-5 pb-7 pt-5 sm:pb-8 sm:pt-7">
        <div className="pointer-events-none absolute left-[-120px] top-10 h-72 w-72 rounded-full border border-[#c89a3d]/15" />
        <div className="pointer-events-none absolute right-[-120px] bottom-[-80px] h-80 w-80 rounded-full border border-[#c89a3d]/15" />

        <div className="relative mx-auto max-w-4xl text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-semibold text-[#8a6c45] transition hover:text-[#a70e18]"
          >
            <i className="fa-solid fa-arrow-left" />
            BACK TO HOME
          </Link>

          <div className="mx-auto mt-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#d7b66a] bg-[#fff8ec] text-lg text-[#a70e18] shadow-sm">
            <i className="fa-solid fa-bolt" />
          </div>

          <p className="mt-3 text-[9px] font-bold tracking-[0.35em] text-[#a77a2b]">
            PLAY & DISCOVER
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#761019] sm:text-4xl">
            60-Second Mythology Challenge
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-[#766457] sm:text-sm">
            How many mythology questions can you answer correctly in just 20 seconds?
            Questions come from Maa Durga, Shiva, Ganesha and Hindu mythology.
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span className="rounded-full border border-[#d7b66a] bg-white/60 px-3 py-1.5 text-[9px] font-bold tracking-[0.12em] text-[#7d531f]">
              <i className="fa-regular fa-clock mr-2 text-[#a70e18]" />
              20 SECONDS
            </span>
            <span className="rounded-full border border-[#d7b66a] bg-white/60 px-3 py-1.5 text-[9px] font-bold tracking-[0.12em] text-[#7d531f]">
              <i className="fa-solid fa-bolt mr-2 text-[#a70e18]" />
              RAPID FIRE
            </span>
            <span className="rounded-full border border-[#d7b66a] bg-white/60 px-3 py-1.5 text-[9px] font-bold tracking-[0.12em] text-[#7d531f]">
              <i className="fa-solid fa-trophy mr-2 text-[#a70e18]" />
              HIGH SCORE
            </span>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f0e5] px-4 py-5 sm:py-7">
        <div className="mx-auto max-w-3xl">
          {!gameStarted && !gameOver ? (
            <div className="rounded-2xl border border-[#e4d3bc] bg-white p-6 text-center shadow-xl sm:p-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-8 border-[#a70e18]/10 bg-[#fff8ec] text-3xl text-[#a70e18]">
                <i className="fa-solid fa-stopwatch" />
              </div>

              <p className="mt-5 text-[9px] font-bold tracking-[0.35em] text-[#a77a2b]">
                READY?
              </p>

              <h2 className="mt-2 text-3xl font-bold text-[#761019]">
                Answer as many as you can!
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#766457]">
                You have 20 seconds. Pick an answer and the next question appears
                immediately. Your final score shows how many you answered correctly
                out of the total questions you attempted.
              </p>

              <button
                type="button"
                onClick={startGame}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-[#a70e18] px-8 py-4 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#7d0b13]"
              >
                <i className="fa-solid fa-play mr-3" />
                START 20-SECOND CHALLENGE
              </button>
            </div>
          ) : gameOver ? (
            <div className="rounded-2xl border border-[#e4d3bc] bg-white p-5 shadow-xl sm:p-8">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d7b66a] bg-[#fff8ec] text-2xl text-[#a70e18]">
                  <i className="fa-solid fa-trophy" />
                </div>

                <p className="mt-4 text-[9px] font-bold tracking-[0.35em] text-[#a77a2b]">
                  TIME'S UP!
                </p>

                <h2 className="mt-2 text-4xl font-bold text-[#761019] sm:text-5xl">
                  {score}/{answeredCount}
                </h2>

                <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#8a6c45]">
                  CORRECTLY ANSWERED
                </p>

                <p className="mt-4 text-base font-semibold text-[#8a6c45]">
                  {getScoreMessage()}
                </p>
              </div>

              {wrongAnswers.length > 0 && (
                <div className="mt-7">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600">
                      <i className="fa-solid fa-circle-xmark" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#761019]">
                        Review Your Answers
                      </h3>
                      <p className="text-[10px] text-[#8a7667]">
                        Here are the questions you got wrong.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {wrongAnswers.map((item, index) => (
                      <div
                        key={`${item.question}-${index}`}
                        className="rounded-xl border border-[#ead8d0] bg-[#fffaf7] p-4"
                      >
                        <p className="text-sm font-bold leading-5 text-[#761019]">
                          {item.question}
                        </p>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-red-600">
                              YOUR ANSWER
                            </p>
                            <p className="mt-1 text-xs font-semibold text-red-900">
                              {item.selectedAnswer}
                            </p>
                          </div>

                          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-green-700">
                              CORRECT ANSWER
                            </p>
                            <p className="mt-1 text-xs font-semibold text-green-900">
                              {item.correctAnswer}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wrongAnswers.length === 0 && answeredCount > 0 && (
                <div className="mt-7 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                  <i className="fa-solid fa-circle-check text-2xl text-green-600" />
                  <p className="mt-2 text-sm font-bold text-green-900">
                    Perfect! You got every answered question correct.
                  </p>
                </div>
              )}

              <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    createGame();
                    window.setTimeout(startGame, 0);
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-[#a70e18] px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#7d0b13]"
                >
                  <i className="fa-solid fa-rotate-right mr-3" />
                  PLAY AGAIN
                </button>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-[#d7b66a] bg-white px-7 py-3.5 text-sm font-bold text-[#761019] transition hover:bg-[#fff8ec]"
                >
                  <i className="fa-solid fa-house mr-3" />
                  BACK TO HOME
                </Link>
              </div>
            </div>
          ) : question ? (
            <div className="rounded-2xl border border-[#e4d3bc] bg-white p-4 shadow-xl sm:p-6">
              <div className="mb-4 rounded-xl border border-[#e4d3bc] bg-[#fffaf2] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8a6c45]">
                      TIME LEFT
                    </p>
                    <p className={`mt-1 text-3xl font-black ${timeLeft <= 5 ? "text-[#a70e18]" : "text-[#761019]"}`}>
                      {timeLeft}s
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8a6c45]">
                      SCORE
                    </p>
                    <p className="mt-1 text-3xl font-black text-[#a70e18]">
                      {score}
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eadbc6]">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? "bg-red-600" : "bg-[#a70e18]"}`}
                    style={{ width: `${Math.max(0, 100 - progress)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-[#fffaf2] p-4 text-center sm:p-6">
                <p className="text-[9px] font-bold tracking-[0.2em] text-[#a77a2b]">
                  QUESTION
                </p>

                <h2 className="mt-2 text-xl font-bold leading-snug text-[#761019] sm:text-2xl">
                  {question.question}
                </h2>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {question.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === question.answer;

                  let optionClass =
                    "border-[#e5d7c4] bg-[#fffaf2] hover:border-[#d7b66a] hover:bg-[#fff8ec]";

                  if (isSelected && isCorrect) {
                    optionClass = "border-green-600 bg-green-50 text-green-900";
                  } else if (isSelected && !isCorrect) {
                    optionClass = "border-red-500 bg-red-50 text-red-900";
                  }

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => selectAnswer(index)}
                      disabled={selectedAnswer !== null}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition duration-150 ${optionClass}`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d7b66a] bg-white text-sm font-bold text-[#a70e18]">
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span className="flex-1 text-xs font-semibold leading-5 sm:text-sm">
                        {option}
                      </span>

                      {isSelected && isCorrect && (
                        <i className="fa-solid fa-circle-check text-green-600" />
                      )}

                      {isSelected && !isCorrect && (
                        <i className="fa-solid fa-circle-xmark text-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between text-[10px] text-[#8a7667]">
                <span>Question {currentQuestion + 1}</span>
                <span>Answer quickly — the clock keeps running!</span>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <footer className="bg-[#241b17] px-5 py-5 text-[#eadbc4]">
        <div className="mx-auto max-w-6xl text-center">
          <div className="flex items-center justify-center gap-3 text-[#e5c16b]">
            <i className="fa-solid fa-spa" />
            <div className="h-px w-12 bg-[#e5c16b]/30" />
            <i className="fa-solid fa-om text-xl" />
            <div className="h-px w-12 bg-[#e5c16b]/30" />
            <i className="fa-solid fa-spa" />
          </div>

          <p className="mt-5 text-lg font-bold tracking-[0.25em] text-[#e5c16b]">
            JAI MAA DURGA
          </p>

          <p className="mt-2 text-[10px] tracking-[0.25em] text-[#9c8b76]">
            A STRONGER COMMUNITY TOGETHER
          </p>

          <p className="mt-6 text-[10px] text-[#756658]">
            © 2026 BUH Durga Puja Committee. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
