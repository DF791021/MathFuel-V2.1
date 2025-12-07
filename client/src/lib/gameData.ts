export type CardCategory = 
  | "energy" 
  | "safety" 
  | "literacy" 
  | "culture" 
  | "health" 
  | "classification";

export type ChallengeCard = {
  id: number;
  category: CardCategory;
  question: string;
  type: "question" | "activity";
  answer?: string; // For questions
};

export type FunFactCard = {
  id: number;
  fact: string;
};

export const CHALLENGE_CARDS: ChallengeCard[] = [
  // Standard 1: Nutrition for Energy and Growth
  { id: 1, category: "energy", type: "question", question: "Name one food that gives you energy to play.", answer: "Any carbohydrate-rich food like bread, pasta, fruit, or oatmeal." },
  { id: 2, category: "energy", type: "activity", question: "Do 5 jumping jacks to show how you use energy from food." },
  { id: 3, category: "energy", type: "question", question: "Why is it important to eat breakfast every day?", answer: "It gives you energy to start the day and helps you focus in school." },
  { id: 4, category: "energy", type: "question", question: "What is one healthy snack you can eat after school?", answer: "Apple slices, carrot sticks, yogurt, nuts, etc." },
  { id: 5, category: "energy", type: "question", question: "True or False: All fats are bad for you.", answer: "False. Healthy fats like those in avocados and nuts are good for you." },
  
  // Standard 2: Food Safety and Food Systems
  { id: 11, category: "safety", type: "question", question: "What should you do before you eat or help make food?", answer: "Wash your hands with soap and water." },
  { id: 12, category: "safety", type: "question", question: "Where does the milk you drink come from?", answer: "From cows (usually on dairy farms)." },
  { id: 13, category: "safety", type: "question", question: "True or False: It's okay to eat food that has fallen on the floor.", answer: "False. Germs can get on the food instantly." },
  { id: 14, category: "safety", type: "question", question: "Why is it important to wash fruits and vegetables before eating them?", answer: "To remove dirt, germs, and chemicals." },
  
  // Standard 3: Nutrition Literacy
  { id: 21, category: "literacy", type: "question", question: "What are the five food groups?", answer: "Fruits, Vegetables, Grains, Protein, Dairy." },
  { id: 22, category: "literacy", type: "question", question: "Name a food from the vegetable group.", answer: "Carrot, broccoli, spinach, corn, etc." },
  { id: 23, category: "literacy", type: "question", question: "Name a food from the dairy group.", answer: "Milk, cheese, yogurt." },
  { id: 24, category: "literacy", type: "activity", question: "Draw a picture of a healthy meal using foods from at least three different food groups in the air with your finger." },

  // Standard 4: Food, Nutrition, and Culture
  { id: 31, category: "culture", type: "question", question: "What is a traditional Wisconsin food?", answer: "Cheese curds, bratwurst, cranberries, fish fry." },
  { id: 32, category: "culture", type: "question", question: "Name a food that is grown in Wisconsin.", answer: "Corn, potatoes, cranberries, ginseng, snap beans." },
  { id: 33, category: "culture", type: "question", question: "True or False: People all over the world eat the same kinds of food.", answer: "False. Different cultures have different traditional foods." },

  // Standard 5: Health Enhancing Behaviors
  { id: 41, category: "health", type: "question", question: "What is one thing you can do to be healthy every day?", answer: "Eat fruits/veggies, play outside, drink water, sleep well." },
  { id: 42, category: "health", type: "question", question: "Why is it important to get enough sleep?", answer: "To help your body grow and rest." },
  { id: 43, category: "health", type: "activity", question: "Do a silly dance for 10 seconds." },

  // Standard 6: Identification and Classification
  { id: 51, category: "classification", type: "question", question: "Is a tomato a fruit or a vegetable?", answer: "Botanically a fruit, but we eat it like a vegetable." },
  { id: 52, category: "classification", type: "question", question: "Name a food that is a good source of protein.", answer: "Meat, beans, eggs, nuts, tofu." },
  { id: 53, category: "classification", type: "question", question: "Is a potato a vegetable?", answer: "Yes, it is a starchy vegetable." },
];

export const FUN_FACT_CARDS: FunFactCard[] = [
  { id: 1, fact: "Wisconsin is the #1 producer of cranberries in the United States!" },
  { id: 2, fact: "Wisconsin is called 'America's Dairyland' because it produces more cheese than any other state." },
  { id: 3, fact: "The state fruit of Wisconsin is the cranberry." },
  { id: 4, fact: "The state grain of Wisconsin is corn." },
  { id: 5, fact: "It takes about 10 pounds of milk to make one pound of cheese." },
  { id: 6, fact: "Carrots were originally purple, not orange!" },
  { id: 7, fact: "A strawberry is not actually a berry, but a banana is!" },
  { id: 8, fact: "The potato chip was invented by accident in 1853." },
  { id: 9, fact: "Wisconsin is home to the National Mustard Museum." },
  { id: 10, fact: "The official state beverage of Wisconsin is milk." },
];
