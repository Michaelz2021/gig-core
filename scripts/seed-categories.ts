import { DataSource } from 'typeorm';
import { ServiceCategory } from '../src/modules/services/entities/service-category.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

// 카테고리 데이터 구조 정의
interface CategoryData {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  displayOrder: number;
  children?: CategoryData[];
}

const categoryData: CategoryData[] = [
  {
    name: 'HOME SERVICES',
    slug: 'home-services',
    description: 'Home maintenance and improvement services',
    displayOrder: 1,
    children: [
      {
        name: 'Cleaning Services',
        slug: 'cleaning-services',
        description: 'Professional cleaning services for your home',
        displayOrder: 1,
        children: [
          {
            name: 'General House Cleaning',
            slug: 'general-house-cleaning',
            description: 'General house cleaning services',
            displayOrder: 1,
            children: [
              {
                name: 'Regular Cleaning',
                slug: 'regular-cleaning',
                description: 'Daily, weekly, monthly cleaning services',
                displayOrder: 1,
              },
              {
                name: 'Deep Cleaning',
                slug: 'deep-cleaning',
                description: 'Thorough deep cleaning service',
                displayOrder: 2,
              },
              {
                name: 'Move-in/Move-out Cleaning',
                slug: 'move-in-move-out-cleaning',
                description: 'Cleaning services for moving in or out',
                displayOrder: 3,
              },
              {
                name: 'Spring Cleaning',
                slug: 'spring-cleaning',
                description: 'Comprehensive seasonal spring cleaning',
                displayOrder: 4,
              },
            ],
          },
          {
            name: 'Specialized Cleaning',
            slug: 'specialized-cleaning',
            description: 'Specialized cleaning services',
            displayOrder: 2,
            children: [
              {
                name: 'Carpet Cleaning',
                slug: 'carpet-cleaning',
                description: 'Professional carpet cleaning service',
                displayOrder: 1,
              },
              {
                name: 'Sofa/Upholstery Cleaning',
                slug: 'sofa-upholstery-cleaning',
                description: 'Sofa and upholstery cleaning service',
                displayOrder: 2,
              },
              {
                name: 'Window Cleaning',
                slug: 'window-cleaning',
                description: 'Window and glass cleaning service',
                displayOrder: 3,
              },
              {
                name: 'Post-construction Cleaning',
                slug: 'post-construction-cleaning',
                description: 'Cleaning after construction or renovation',
                displayOrder: 4,
              },
              {
                name: 'Office Cleaning',
                slug: 'office-cleaning',
                description: 'Commercial office cleaning service',
                displayOrder: 5,
              },
              {
                name: 'Disinfection Services',
                slug: 'disinfection-services',
                description: 'Professional disinfection and sanitization',
                displayOrder: 6,
              },
            ],
          },
        ],
      },
      {
        name: 'Plumbing Services',
        slug: 'plumbing-services',
        description: 'Professional plumbing solutions',
        displayOrder: 2,
        children: [
          {
            name: 'General Plumbing',
            slug: 'general-plumbing',
            description: 'General plumbing services',
            displayOrder: 1,
            children: [
              {
                name: 'Leak Repairs',
                slug: 'leak-repairs',
                description: 'Water leak detection and repair',
                displayOrder: 1,
              },
              {
                name: 'Pipe Installation/Replacement',
                slug: 'pipe-installation-replacement',
                description: 'Pipe installation and replacement services',
                displayOrder: 2,
              },
              {
                name: 'Drain Unclogging',
                slug: 'drain-unclogging',
                description: 'Drain cleaning and unclogging service',
                displayOrder: 3,
              },
              {
                name: 'Faucet/Fixture Installation',
                slug: 'faucet-fixture-installation',
                description: 'Faucet and fixture installation',
                displayOrder: 4,
              },
              {
                name: 'Toilet Repair/Replacement',
                slug: 'toilet-repair-replacement',
                description: 'Toilet repair and replacement service',
                displayOrder: 5,
              },
            ],
          },
          {
            name: 'Specialized Plumbing',
            slug: 'specialized-plumbing',
            description: 'Specialized plumbing services',
            displayOrder: 2,
            children: [
              {
                name: 'Water Heater Installation/Repair',
                slug: 'water-heater-installation-repair',
                description: 'Water heater installation and repair',
                displayOrder: 1,
              },
              {
                name: 'Septic Tank Services',
                slug: 'septic-tank-services',
                description: 'Septic tank maintenance and services',
                displayOrder: 2,
              },
              {
                name: 'Water Pump Services',
                slug: 'water-pump-services',
                description: 'Water pump installation and repair',
                displayOrder: 3,
              },
              {
                name: 'Waterproofing',
                slug: 'waterproofing',
                description: 'Waterproofing services',
                displayOrder: 4,
              },
            ],
          },
        ],
      },
      {
        name: 'Electrical Services',
        slug: 'electrical-services',
        description: 'Professional electrical services',
        displayOrder: 3,
        children: [
          {
            name: 'General Electrical',
            slug: 'general-electrical',
            description: 'General electrical services',
            displayOrder: 1,
            children: [
              {
                name: 'Wiring Installation/Repair',
                slug: 'wiring-installation-repair',
                description: 'Electrical wiring installation and repair',
                displayOrder: 1,
              },
              {
                name: 'Light Fixture Installation',
                slug: 'light-fixture-installation',
                description: 'Light fixture installation service',
                displayOrder: 2,
              },
              {
                name: 'Switch/Outlet Installation',
                slug: 'switch-outlet-installation',
                description: 'Switch and outlet installation',
                displayOrder: 3,
              },
              {
                name: 'Circuit Breaker Repair',
                slug: 'circuit-breaker-repair',
                description: 'Circuit breaker repair and maintenance',
                displayOrder: 4,
              },
              {
                name: 'Electrical Troubleshooting',
                slug: 'electrical-troubleshooting',
                description: 'Electrical problem diagnosis and troubleshooting',
                displayOrder: 5,
              },
            ],
          },
          {
            name: 'Specialized Electrical',
            slug: 'specialized-electrical',
            description: 'Specialized electrical services',
            displayOrder: 2,
            children: [
              {
                name: 'CCTV Installation',
                slug: 'cctv-installation',
                description: 'CCTV camera installation service',
                displayOrder: 1,
              },
              {
                name: 'Smart Home Installation',
                slug: 'smart-home-installation',
                description: 'Smart home system installation',
                displayOrder: 2,
              },
              {
                name: 'Solar Panel Installation',
                slug: 'solar-panel-installation',
                description: 'Solar panel installation service',
                displayOrder: 3,
              },
              {
                name: 'Generator Installation/Repair',
                slug: 'generator-installation-repair',
                description: 'Generator installation and repair',
                displayOrder: 4,
              },
              {
                name: 'Electrical Safety Inspection',
                slug: 'electrical-safety-inspection',
                description: 'Electrical safety inspection service',
                displayOrder: 5,
              },
            ],
          },
        ],
      },
      {
        name: 'Air Conditioning Services',
        slug: 'air-conditioning-services',
        description: 'AC cleaning, repair and maintenance',
        displayOrder: 4,
        children: [
          {
            name: 'Aircon Cleaning',
            slug: 'aircon-cleaning',
            description: 'Air conditioning cleaning services',
            displayOrder: 1,
            children: [
              {
                name: 'Basic Cleaning',
                slug: 'basic-cleaning',
                description: 'Basic aircon cleaning service',
                displayOrder: 1,
              },
              {
                name: 'Deep Cleaning/Chemical Wash',
                slug: 'deep-cleaning-chemical-wash',
                description: 'Deep cleaning and chemical wash for aircon',
                displayOrder: 2,
              },
              {
                name: 'Duct Cleaning',
                slug: 'duct-cleaning',
                description: 'Air duct cleaning service',
                displayOrder: 3,
              },
            ],
          },
          {
            name: 'Aircon Repair & Maintenance',
            slug: 'aircon-repair-maintenance',
            description: 'Air conditioning repair and maintenance',
            displayOrder: 2,
            children: [
              {
                name: 'Troubleshooting & Diagnostics',
                slug: 'troubleshooting-diagnostics',
                description: 'Aircon problem diagnosis and troubleshooting',
                displayOrder: 1,
              },
              {
                name: 'Refrigerant Refilling (Freon)',
                slug: 'refrigerant-refilling',
                description: 'Refrigerant refilling service',
                displayOrder: 2,
              },
              {
                name: 'Compressor Replacement',
                slug: 'compressor-replacement',
                description: 'Aircon compressor replacement',
                displayOrder: 3,
              },
              {
                name: 'Installation/Relocation',
                slug: 'installation-relocation',
                description: 'Aircon installation and relocation',
                displayOrder: 4,
              },
              {
                name: 'Preventive Maintenance',
                slug: 'preventive-maintenance',
                description: 'Regular preventive maintenance service',
                displayOrder: 5,
              },
            ],
          },
        ],
      },
      {
        name: 'Carpentry Services',
        slug: 'carpentry-services',
        description: 'Custom carpentry and woodworking',
        displayOrder: 5,
        children: [
          {
            name: 'Furniture Services',
            slug: 'furniture-services',
            description: 'Furniture related services',
            displayOrder: 1,
            children: [
              {
                name: 'Custom Furniture Making',
                slug: 'custom-furniture-making',
                description: 'Custom furniture design and making',
                displayOrder: 1,
              },
              {
                name: 'Furniture Repair/Restoration',
                slug: 'furniture-repair-restoration',
                description: 'Furniture repair and restoration service',
                displayOrder: 2,
              },
              {
                name: 'Cabinet Installation',
                slug: 'cabinet-installation',
                description: 'Cabinet installation service',
                displayOrder: 3,
              },
              {
                name: 'Shelving Installation',
                slug: 'shelving-installation',
                description: 'Shelving installation service',
                displayOrder: 4,
              },
            ],
          },
          {
            name: 'General Carpentry',
            slug: 'general-carpentry',
            description: 'General carpentry services',
            displayOrder: 2,
            children: [
              {
                name: 'Door/Window Installation',
                slug: 'door-window-installation',
                description: 'Door and window installation',
                displayOrder: 1,
              },
              {
                name: 'Partition Installation',
                slug: 'partition-installation',
                description: 'Partition wall installation',
                displayOrder: 2,
              },
              {
                name: 'Ceiling Work',
                slug: 'ceiling-work',
                description: 'Ceiling installation and repair',
                displayOrder: 3,
              },
              {
                name: 'Flooring Installation (Wood)',
                slug: 'flooring-installation-wood',
                description: 'Wood flooring installation',
                displayOrder: 4,
              },
              {
                name: 'Deck Construction',
                slug: 'deck-construction',
                description: 'Deck construction service',
                displayOrder: 5,
              },
            ],
          },
        ],
      },
      {
        name: 'Painting Services',
        slug: 'painting-services',
        description: 'Interior and exterior painting services',
        displayOrder: 6,
        children: [
          {
            name: 'General Painting',
            slug: 'general-painting',
            description: 'General painting services',
            displayOrder: 1,
            children: [
              {
                name: 'Interior Painting',
                slug: 'interior-painting',
                description: 'Interior wall and room painting',
                displayOrder: 1,
              },
              {
                name: 'Wall Painting',
                slug: 'wall-painting',
                description: 'Wall painting service',
                displayOrder: 2,
              },
              {
                name: 'Ceiling Painting',
                slug: 'ceiling-painting',
                description: 'Ceiling painting service',
                displayOrder: 3,
              },
              {
                name: 'Trim/Molding Painting',
                slug: 'trim-molding-painting',
                description: 'Trim and molding painting',
                displayOrder: 4,
              },
              {
                name: 'Cabinet/Furniture Painting',
                slug: 'cabinet-furniture-painting',
                description: 'Cabinet and furniture painting',
                displayOrder: 5,
              },
            ],
          },
          {
            name: 'Exterior Painting',
            slug: 'exterior-painting',
            description: 'Exterior painting services',
            displayOrder: 2,
            children: [
              {
                name: 'House Exterior Painting',
                slug: 'house-exterior-painting',
                description: 'House exterior wall painting',
                displayOrder: 1,
              },
              {
                name: 'Fence Painting',
                slug: 'fence-painting',
                description: 'Fence painting service',
                displayOrder: 2,
              },
              {
                name: 'Roof Painting',
                slug: 'roof-painting',
                description: 'Roof painting service',
                displayOrder: 3,
              },
            ],
          },
          {
            name: 'Specialized Painting',
            slug: 'specialized-painting',
            description: 'Specialized painting services',
            displayOrder: 3,
            children: [
              {
                name: 'Waterproofing with Paint',
                slug: 'waterproofing-with-paint',
                description: 'Waterproofing using paint',
                displayOrder: 1,
              },
              {
                name: 'Decorative/Mural Painting',
                slug: 'decorative-mural-painting',
                description: 'Decorative and mural painting',
                displayOrder: 2,
              },
              {
                name: 'Texture Painting',
                slug: 'texture-painting',
                description: 'Texture painting service',
                displayOrder: 3,
              },
            ],
          },
        ],
      },
      {
        name: 'Pest Control',
        slug: 'pest-control',
        description: 'Termite treatment, Cockroach extermination, Rat/mice control, Bed bug treatment, General pest prevention',
        displayOrder: 7,
      },
      {
        name: 'Gardening & Landscaping',
        slug: 'gardening-landscaping',
        description: 'Lawn mowing, Garden maintenance, Tree trimming, Landscaping design, Plant care',
        displayOrder: 8,
      },
      {
        name: 'Appliance Repair',
        slug: 'appliance-repair',
        description: 'Refrigerator repair, Washing machine repair, Stove/oven repair, Microwave repair, Small appliance repair',
        displayOrder: 9,
      },
      {
        name: 'Home Improvement',
        slug: 'home-improvement',
        description: 'Tiling services, Waterproofing, Masonry work, Welding services, General handyman services',
        displayOrder: 10,
      },
    ],
  },
  {
    name: 'PERSONAL SERVICES',
    slug: 'personal-services',
    description: 'Personal care and wellness services',
    displayOrder: 2,
    children: [
      {
        name: 'Education & Tutoring',
        slug: 'education-tutoring',
        description: 'Academic and skill-based tutoring',
        displayOrder: 1,
        children: [
          {
            name: 'Academic Tutoring',
            slug: 'academic-tutoring',
            description: 'Academic tutoring services',
            displayOrder: 1,
            children: [
              {
                name: 'Elementary Tutoring',
                slug: 'elementary-tutoring',
                description: 'Elementary level tutoring for all subjects',
                displayOrder: 1,
              },
              {
                name: 'High School Tutoring',
                slug: 'high-school-tutoring',
                description: 'High school tutoring (Math, Science, English, Filipino)',
                displayOrder: 2,
              },
              {
                name: 'College Tutoring',
                slug: 'college-tutoring',
                description: 'College level tutoring for specific subjects',
                displayOrder: 3,
              },
              {
                name: 'Exam Preparation',
                slug: 'exam-preparation',
                description: 'Exam preparation (UPCAT, ACET, college entrance)',
                displayOrder: 4,
              },
            ],
          },
          {
            name: 'Language Learning',
            slug: 'language-learning',
            description: 'Language learning services',
            displayOrder: 2,
            children: [
              {
                name: 'English Tutoring',
                slug: 'english-tutoring',
                description: 'English language tutoring',
                displayOrder: 1,
              },
              {
                name: 'Korean Language',
                slug: 'korean-language',
                description: 'Korean language lessons',
                displayOrder: 2,
              },
              {
                name: 'Japanese Language',
                slug: 'japanese-language',
                description: 'Japanese language lessons',
                displayOrder: 3,
              },
              {
                name: 'Mandarin Chinese',
                slug: 'mandarin-chinese',
                description: 'Mandarin Chinese language lessons',
                displayOrder: 4,
              },
              {
                name: 'Spanish Language',
                slug: 'spanish-language',
                description: 'Spanish language lessons',
                displayOrder: 5,
              },
            ],
          },
          {
            name: 'Music Lessons',
            slug: 'music-lessons',
            description: 'Music lesson services',
            displayOrder: 3,
            children: [
              {
                name: 'Piano Lessons',
                slug: 'piano-lessons',
                description: 'Piano lessons',
                displayOrder: 1,
              },
              {
                name: 'Guitar Lessons',
                slug: 'guitar-lessons',
                description: 'Guitar lessons',
                displayOrder: 2,
              },
              {
                name: 'Voice/Singing Lessons',
                slug: 'voice-singing-lessons',
                description: 'Voice and singing lessons',
                displayOrder: 3,
              },
              {
                name: 'Drums Lessons',
                slug: 'drums-lessons',
                description: 'Drums lessons',
                displayOrder: 4,
              },
              {
                name: 'Violin Lessons',
                slug: 'violin-lessons',
                description: 'Violin lessons',
                displayOrder: 5,
              },
            ],
          },
          {
            name: 'Skills Training',
            slug: 'skills-training',
            description: 'Skills training services',
            displayOrder: 4,
            children: [
              {
                name: 'Computer/IT Training',
                slug: 'computer-it-training',
                description: 'Computer and IT skills training',
                displayOrder: 1,
              },
              {
                name: 'Coding/Programming Lessons',
                slug: 'coding-programming-lessons',
                description: 'Coding and programming lessons',
                displayOrder: 2,
              },
              {
                name: 'Art/Drawing Lessons',
                slug: 'art-drawing-lessons',
                description: 'Art and drawing lessons',
                displayOrder: 3,
              },
              {
                name: 'Dance Lessons',
                slug: 'dance-lessons',
                description: 'Dance lessons',
                displayOrder: 4,
              },
            ],
          },
        ],
      },
      {
        name: 'Fitness & Wellness',
        slug: 'fitness-wellness',
        description: 'Personal training and wellness services',
        displayOrder: 2,
        children: [
          {
            name: 'Personal Training',
            slug: 'personal-training',
            description: 'Personal training services',
            displayOrder: 1,
            children: [
              {
                name: 'One-on-one Training',
                slug: 'one-on-one-training',
                description: 'Individual personal training',
                displayOrder: 1,
              },
              {
                name: 'Group Fitness Classes',
                slug: 'group-fitness-classes',
                description: 'Group fitness training classes',
                displayOrder: 2,
              },
              {
                name: 'Home Workout Programs',
                slug: 'home-workout-programs',
                description: 'Home-based workout programs',
                displayOrder: 3,
              },
              {
                name: 'Sports-specific Training',
                slug: 'sports-specific-training',
                description: 'Training for specific sports',
                displayOrder: 4,
              },
              {
                name: 'Weight Loss Programs',
                slug: 'weight-loss-programs',
                description: 'Weight loss training programs',
                displayOrder: 5,
              },
            ],
          },
          {
            name: 'Yoga & Pilates',
            slug: 'yoga-pilates',
            description: 'Yoga and Pilates services',
            displayOrder: 2,
            children: [
              {
                name: 'Yoga Instruction',
                slug: 'yoga-instruction',
                description: 'Yoga instruction and classes',
                displayOrder: 1,
              },
              {
                name: 'Pilates Training',
                slug: 'pilates-training',
                description: 'Pilates training classes',
                displayOrder: 2,
              },
              {
                name: 'Meditation Coaching',
                slug: 'meditation-coaching',
                description: 'Meditation coaching and guidance',
                displayOrder: 3,
              },
            ],
          },
          {
            name: 'Health & Wellness',
            slug: 'health-wellness',
            description: 'Health and wellness services',
            displayOrder: 3,
            children: [
              {
                name: 'Nutrition Coaching',
                slug: 'nutrition-coaching',
                description: 'Nutrition coaching service',
                displayOrder: 1,
              },
              {
                name: 'Meal Planning',
                slug: 'meal-planning',
                description: 'Meal planning service',
                displayOrder: 2,
              },
              {
                name: 'Nutrition Consultation',
                slug: 'nutrition-consultation',
                description: 'Nutrition consultation service',
                displayOrder: 3,
              },
              {
                name: 'Diet Guidance',
                slug: 'diet-guidance',
                description: 'Diet guidance and counseling',
                displayOrder: 4,
              },
            ],
          },
        ],
      },
      {
        name: 'Beauty & Grooming',
        slug: 'beauty-grooming',
        description: 'Beauty and personal care services',
        displayOrder: 3,
        children: [
          {
            name: 'Hair Services',
            slug: 'hair-services',
            description: 'Hair care services',
            displayOrder: 1,
            children: [
              {
                name: 'Haircut (Home Service)',
                slug: 'haircut-home-service',
                description: 'Home service haircut',
                displayOrder: 1,
              },
              {
                name: 'Hair Coloring',
                slug: 'hair-coloring',
                description: 'Hair coloring service',
                displayOrder: 2,
              },
              {
                name: 'Hair Treatment/Rebonding',
                slug: 'hair-treatment-rebonding',
                description: 'Hair treatment and rebonding',
                displayOrder: 3,
              },
              {
                name: 'Hair Styling for Events',
                slug: 'hair-styling-events',
                description: 'Event hair styling service',
                displayOrder: 4,
              },
            ],
          },
          {
            name: 'Makeup Services',
            slug: 'makeup-services',
            description: 'Makeup services',
            displayOrder: 2,
            children: [
              {
                name: 'Bridal Makeup',
                slug: 'bridal-makeup',
                description: 'Bridal makeup service',
                displayOrder: 1,
              },
              {
                name: 'Event/Party Makeup',
                slug: 'event-party-makeup',
                description: 'Event and party makeup service',
                displayOrder: 2,
              },
              {
                name: 'Makeup Lessons',
                slug: 'makeup-lessons',
                description: 'Makeup application lessons',
                displayOrder: 3,
              },
            ],
          },
          {
            name: 'Nail Services',
            slug: 'nail-services',
            description: 'Nail care services',
            displayOrder: 3,
            children: [
              {
                name: 'Manicure',
                slug: 'manicure',
                description: 'Manicure service',
                displayOrder: 1,
              },
              {
                name: 'Pedicure',
                slug: 'pedicure',
                description: 'Pedicure service',
                displayOrder: 2,
              },
              {
                name: 'Nail Art',
                slug: 'nail-art',
                description: 'Nail art design service',
                displayOrder: 3,
              },
            ],
          },
          {
            name: 'Spa Services',
            slug: 'spa-services',
            description: 'Spa and wellness services',
            displayOrder: 4,
            children: [
              {
                name: 'Massage Therapy',
                slug: 'massage-therapy',
                description: 'Massage therapy (Swedish, Shiatsu, Deep tissue)',
                displayOrder: 1,
              },
              {
                name: 'Facial Treatment',
                slug: 'facial-treatment',
                description: 'Facial treatment service',
                displayOrder: 2,
              },
              {
                name: 'Waxing Services',
                slug: 'waxing-services',
                description: 'Waxing service',
                displayOrder: 3,
              },
            ],
          },
        ],
      },
      {
        name: 'Childcare',
        slug: 'childcare',
        description: 'Babysitting, Nanny services, Homework assistance, Child transportation',
        displayOrder: 4,
      },
      {
        name: 'Eldercare',
        slug: 'eldercare',
        description: 'Companion services, Personal care assistance, Medication reminders, Transportation assistance',
        displayOrder: 5,
      },
      {
        name: 'Pet Care',
        slug: 'pet-care',
        description: 'Dog walking, Pet sitting, Pet grooming, Pet training, Veterinary transportation',
        displayOrder: 6,
      },
    ],
  },
  {
    name: 'EVENTS SERVICES',
    slug: 'events-services',
    description: 'Event planning and entertainment services',
    displayOrder: 3,
    children: [
      {
        name: 'Photography Services',
        slug: 'photography-services',
        description: 'Professional photography services',
        displayOrder: 1,
        children: [
          {
            name: 'Event Photography',
            slug: 'event-photography',
            description: 'Event photography services',
            displayOrder: 1,
            children: [
              {
                name: 'Wedding Photography',
                slug: 'wedding-photography',
                description: 'Wedding photography service',
                displayOrder: 1,
              },
              {
                name: 'Birthday Photography',
                slug: 'birthday-photography',
                description: 'Birthday party photography',
                displayOrder: 2,
              },
              {
                name: 'Corporate Event Photography',
                slug: 'corporate-event-photography',
                description: 'Corporate event photography',
                displayOrder: 3,
              },
              {
                name: 'Debut Photography',
                slug: 'debut-photography',
                description: 'Debut photography service',
                displayOrder: 4,
              },
              {
                name: 'Christening/Baptism Photography',
                slug: 'christening-baptism-photography',
                description: 'Christening and baptism photography',
                displayOrder: 5,
              },
            ],
          },
          {
            name: 'Portrait Photography',
            slug: 'portrait-photography',
            description: 'Portrait photography services',
            displayOrder: 2,
            children: [
              {
                name: 'Family Portraits',
                slug: 'family-portraits',
                description: 'Family portrait photography',
                displayOrder: 1,
              },
              {
                name: 'Professional Headshots',
                slug: 'professional-headshots',
                description: 'Professional headshot photography',
                displayOrder: 2,
              },
              {
                name: 'Maternity Photography',
                slug: 'maternity-photography',
                description: 'Maternity photography service',
                displayOrder: 3,
              },
              {
                name: 'Graduation Photography',
                slug: 'graduation-photography',
                description: 'Graduation photography service',
                displayOrder: 4,
              },
            ],
          },
          {
            name: 'Product Photography',
            slug: 'product-photography',
            description: 'Product photography services',
            displayOrder: 3,
            children: [
              {
                name: 'E-commerce Product Shots',
                slug: 'ecommerce-product-shots',
                description: 'E-commerce product photography',
                displayOrder: 1,
              },
              {
                name: 'Food Photography',
                slug: 'food-photography',
                description: 'Food photography service',
                displayOrder: 2,
              },
              {
                name: 'Real Estate Photography',
                slug: 'real-estate-photography',
                description: 'Real estate photography service',
                displayOrder: 3,
              },
            ],
          },
        ],
      },
      {
        name: 'Videography Services',
        slug: 'videography-services',
        description: 'Wedding videography, Event videography, Corporate video production, Music video production, Drone videography, Video editing services',
        displayOrder: 2,
      },
      {
        name: 'Catering Services',
        slug: 'catering-services',
        description: 'Professional catering services',
        displayOrder: 3,
        children: [
          {
            name: 'Full Catering',
            slug: 'full-catering',
            description: 'Full catering services',
            displayOrder: 1,
            children: [
              {
                name: 'Wedding Catering',
                slug: 'wedding-catering',
                description: 'Wedding catering service',
                displayOrder: 1,
              },
              {
                name: 'Birthday Party Catering',
                slug: 'birthday-party-catering',
                description: 'Birthday party catering service',
                displayOrder: 2,
              },
              {
                name: 'Corporate Event Catering',
                slug: 'corporate-event-catering',
                description: 'Corporate event catering service',
                displayOrder: 3,
              },
              {
                name: 'Buffet Services',
                slug: 'buffet-services',
                description: 'Buffet catering service',
                displayOrder: 4,
              },
            ],
          },
          {
            name: 'Specialty Catering',
            slug: 'specialty-catering',
            description: 'Specialty catering services',
            displayOrder: 2,
            children: [
              {
                name: 'Filipino Cuisine',
                slug: 'filipino-cuisine',
                description: 'Filipino cuisine catering',
                displayOrder: 1,
              },
              {
                name: 'International Cuisine',
                slug: 'international-cuisine',
                description: 'International cuisine catering',
                displayOrder: 2,
              },
              {
                name: 'BBQ/Lechon Services',
                slug: 'bbq-lechon-services',
                description: 'BBQ and lechon catering service',
                displayOrder: 3,
              },
              {
                name: 'Dessert Catering',
                slug: 'dessert-catering',
                description: 'Dessert catering service',
                displayOrder: 4,
              },
              {
                name: 'Coffee Bar Services',
                slug: 'coffee-bar-services',
                description: 'Coffee bar catering service',
                displayOrder: 5,
              },
            ],
          },
        ],
      },
      {
        name: 'Event Planning',
        slug: 'event-planning',
        description: 'Wedding planning, Birthday party planning, Corporate event planning, Event coordination, Venue decoration',
        displayOrder: 4,
      },
      {
        name: 'Entertainment Services',
        slug: 'entertainment-services',
        description: 'Event entertainment and AV services',
        displayOrder: 5,
        children: [
          {
            name: 'Hosts & Emcees',
            slug: 'hosts-emcees',
            description: 'Host and emcee services',
            displayOrder: 1,
            children: [
              {
                name: 'Wedding Host/MC',
                slug: 'wedding-host-mc',
                description: 'Wedding host and MC service',
                displayOrder: 1,
              },
              {
                name: 'Birthday Party Host',
                slug: 'birthday-party-host',
                description: 'Birthday party host service',
                displayOrder: 2,
              },
              {
                name: 'Corporate Event Host',
                slug: 'corporate-event-host',
                description: 'Corporate event host service',
                displayOrder: 3,
              },
            ],
          },
          {
            name: 'Musicians & Performers',
            slug: 'musicians-performers',
            description: 'Musicians and performers services',
            displayOrder: 2,
            children: [
              {
                name: 'Live Band',
                slug: 'live-band',
                description: 'Live band performance',
                displayOrder: 1,
              },
              {
                name: 'Solo Acoustic Performer',
                slug: 'solo-acoustic-performer',
                description: 'Solo acoustic performer service',
                displayOrder: 2,
              },
              {
                name: 'DJ Services',
                slug: 'dj-services',
                description: 'DJ services',
                displayOrder: 3,
              },
              {
                name: 'Magician/Entertainer',
                slug: 'magician-entertainer',
                description: 'Magician and entertainer service',
                displayOrder: 4,
              },
              {
                name: 'Clown/Mascot for Kids Parties',
                slug: 'clown-mascot-kids-parties',
                description: 'Clown and mascot services for kids parties',
                displayOrder: 5,
              },
            ],
          },
          {
            name: 'Audio/Visual Services',
            slug: 'audio-visual-services',
            description: 'Audio and visual services',
            displayOrder: 3,
            children: [
              {
                name: 'Sound System Rental & Operation',
                slug: 'sound-system-rental-operation',
                description: 'Sound system rental and operation',
                displayOrder: 1,
              },
              {
                name: 'LED Wall/Projector Rental',
                slug: 'led-wall-projector-rental',
                description: 'LED wall and projector rental',
                displayOrder: 2,
              },
              {
                name: 'Lighting Services',
                slug: 'lighting-services',
                description: 'Event lighting services',
                displayOrder: 3,
              },
              {
                name: 'Photo Booth Services',
                slug: 'photo-booth-services',
                description: 'Photo booth rental service',
                displayOrder: 4,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'FREELANCE & DIGITAL SERVICES',
    slug: 'freelance-digital-services',
    description: 'Digital and freelance services',
    displayOrder: 4,
    children: [
      {
        name: 'Graphic Design',
        slug: 'graphic-design',
        description: 'Logo design, Business card design, Flyer/poster design, Social media graphics, Packaging design, Banner/tarpaulin design, Branding/brand identity, Illustration services',
        displayOrder: 1,
      },
      {
        name: 'Writing & Content',
        slug: 'writing-content',
        description: 'Content writing and translation services',
        displayOrder: 2,
        children: [
          {
            name: 'Content Writing',
            slug: 'content-writing',
            description: 'Content writing services',
            displayOrder: 1,
            children: [
              {
                name: 'Blog Writing',
                slug: 'blog-writing',
                description: 'Blog writing service',
                displayOrder: 1,
              },
              {
                name: 'Article Writing',
                slug: 'article-writing',
                description: 'Article writing service',
                displayOrder: 2,
              },
              {
                name: 'SEO Content Writing',
                slug: 'seo-content-writing',
                description: 'SEO optimized content writing',
                displayOrder: 3,
              },
              {
                name: 'Product Descriptions',
                slug: 'product-descriptions',
                description: 'Product description writing',
                displayOrder: 4,
              },
            ],
          },
          {
            name: 'Creative Writing',
            slug: 'creative-writing',
            description: 'Creative writing services',
            displayOrder: 2,
            children: [
              {
                name: 'Copywriting',
                slug: 'copywriting',
                description: 'Copywriting service',
                displayOrder: 1,
              },
              {
                name: 'Script Writing',
                slug: 'script-writing',
                description: 'Script writing service',
                displayOrder: 2,
              },
              {
                name: 'Speech Writing',
                slug: 'speech-writing',
                description: 'Speech writing service',
                displayOrder: 3,
              },
            ],
          },
          {
            name: 'Translation Services',
            slug: 'translation-services',
            description: 'Translation services',
            displayOrder: 3,
            children: [
              {
                name: 'English-Filipino Translation',
                slug: 'english-filipino-translation',
                description: 'English to Filipino translation',
                displayOrder: 1,
              },
              {
                name: 'Filipino-English Translation',
                slug: 'filipino-english-translation',
                description: 'Filipino to English translation',
                displayOrder: 2,
              },
              {
                name: 'Other Language Pairs',
                slug: 'other-language-pairs',
                description: 'Other language pair translations',
                displayOrder: 3,
              },
            ],
          },
        ],
      },
      {
        name: 'Virtual Assistant Services',
        slug: 'virtual-assistant-services',
        description: 'Administrative support, Email management, Calendar/schedule management, Data entry, Customer service support, Social media management',
        displayOrder: 3,
      },
      {
        name: 'Web Development',
        slug: 'web-development',
        description: 'Website design, WordPress development, E-commerce setup (Shopify, WooCommerce), Website maintenance, Landing page design, UI/UX design',
        displayOrder: 4,
      },
      {
        name: 'Digital Marketing',
        slug: 'digital-marketing',
        description: 'Social media marketing, Facebook ads management, Google ads management, SEO services, Email marketing, Influencer coordination',
        displayOrder: 5,
      },
      {
        name: 'Video & Photo Editing',
        slug: 'video-photo-editing',
        description: 'Photo retouching/editing, Video editing, Color grading, Motion graphics, Subtitle/caption creation',
        displayOrder: 6,
      },
      {
        name: 'Business Services',
        slug: 'business-services',
        description: 'Business and legal document services',
        displayOrder: 7,
        children: [
          {
            name: 'Accounting & Bookkeeping',
            slug: 'accounting-bookkeeping',
            description: 'Accounting and bookkeeping services',
            displayOrder: 1,
            children: [
              {
                name: 'Bookkeeping Services',
                slug: 'bookkeeping-services',
                description: 'Bookkeeping service',
                displayOrder: 1,
              },
              {
                name: 'Tax Preparation',
                slug: 'tax-preparation',
                description: 'Tax preparation service',
                displayOrder: 2,
              },
              {
                name: 'Financial Analysis',
                slug: 'financial-analysis',
                description: 'Financial analysis service',
                displayOrder: 3,
              },
            ],
          },
          {
            name: 'Legal Services (Document Preparation Only)',
            slug: 'legal-services-document',
            description: 'Legal document preparation services',
            displayOrder: 2,
            children: [
              {
                name: 'Contract Drafting',
                slug: 'contract-drafting',
                description: 'Contract drafting service',
                displayOrder: 1,
              },
              {
                name: 'Document Notarization Coordination',
                slug: 'document-notarization-coordination',
                description: 'Document notarization coordination',
                displayOrder: 2,
              },
              {
                name: 'Business Registration Assistance',
                slug: 'business-registration-assistance',
                description: 'Business registration assistance',
                displayOrder: 3,
              },
            ],
          },
        ],
      },
    ],
  },
];

async function seedCategories() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'ai_trusttrade',
    entities: [path.join(__dirname, '../src/**/*.entity{.ts,.js}')],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공');

    const categoryRepository = dataSource.getRepository(ServiceCategory);

    // 기존 카테고리 삭제 (선택사항)
    console.log('🗑️  기존 카테고리 삭제 중...');
    await categoryRepository
      .createQueryBuilder()
      .delete()
      .from(ServiceCategory)
      .execute();

    // 1단계 카테고리 삽입
    console.log('📝 카테고리 데이터 삽입 중...');
    const level1Categories: Map<string, ServiceCategory> = new Map();

    for (const level1Data of categoryData) {
      const level1Category = categoryRepository.create({
        name: level1Data.name,
        slug: level1Data.slug,
        description: level1Data.description,
        displayOrder: level1Data.displayOrder,
        parentCategoryId: null,
        isActive: true,
      });
      const savedLevel1 = await categoryRepository.save(level1Category);
      level1Categories.set(level1Data.slug, savedLevel1);
      console.log(`  ✓ Level 1: ${level1Data.name}`);

      // 2단계 카테고리 삽입
      if (level1Data.children) {
        const level2Categories: Map<string, ServiceCategory> = new Map();
        for (const level2Data of level1Data.children) {
          const level2Category = categoryRepository.create({
            name: level2Data.name,
            slug: level2Data.slug,
            description: level2Data.description,
            displayOrder: level2Data.displayOrder,
            parentCategoryId: savedLevel1.id,
            isActive: true,
          });
          const savedLevel2 = await categoryRepository.save(level2Category);
          level2Categories.set(level2Data.slug, savedLevel2);
          console.log(`    ✓ Level 2: ${level2Data.name}`);

          // 3단계 카테고리 삽입
          if (level2Data.children) {
            for (const level3Data of level2Data.children) {
              const level3Category = categoryRepository.create({
                name: level3Data.name,
                slug: level3Data.slug,
                description: level3Data.description,
                displayOrder: level3Data.displayOrder,
                parentCategoryId: savedLevel2.id,
                isActive: true,
              });
              const savedLevel3 = await categoryRepository.save(level3Category);
              console.log(`      ✓ Level 3: ${level3Data.name}`);

              // 4단계 카테고리 삽입
              if (level3Data.children) {
                for (const level4Data of level3Data.children) {
                  const level4Category = categoryRepository.create({
                    name: level4Data.name,
                    slug: level4Data.slug,
                    description: level4Data.description,
                    displayOrder: level4Data.displayOrder,
                    parentCategoryId: savedLevel3.id,
                    isActive: true,
                  });
                  await categoryRepository.save(level4Category);
                  console.log(`        ✓ Level 4: ${level4Data.name}`);
                }
              }
            }
          }
        }
      }
    }

    console.log('\n✅ 카테고리 시드 데이터 삽입 완료!');
    const totalCount = await categoryRepository.count();
    console.log(`📊 총 ${totalCount}개의 카테고리가 생성되었습니다.`);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    process.exit(1);
  }
}

seedCategories();

