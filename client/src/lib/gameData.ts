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
  answer?: string;
};

export type FunFactCard = {
  id: number;
  fact: string;
};

export const CHALLENGE_CARDS: ChallengeCard[] = [
  // Standard 1: Nutrition for Energy and Growth
  { id: 1, category: "energy", type: "question", question: "Name one food that gives you energy to play.", answer: "Bread, pasta, fruit, oatmeal, rice, or any carbohydrate-rich food." },
  { id: 2, category: "energy", type: "activity", question: "Do 5 jumping jacks to show how your body uses energy from food!" },
  { id: 3, category: "energy", type: "question", question: "Why is it important to eat breakfast every day?", answer: "It gives you energy to start the day and helps you focus in school." },
  { id: 4, category: "energy", type: "question", question: "What is one healthy snack you can eat after school?", answer: "Apple slices, carrot sticks, yogurt, nuts, cheese, or fruit." },
  { id: 5, category: "energy", type: "question", question: "True or False: All fats are bad for you.", answer: "False! Healthy fats in avocados, nuts, and fish are good for your brain." },
  { id: 6, category: "energy", type: "question", question: "What gives you more energy: a candy bar or an apple?", answer: "An apple gives you longer-lasting energy because of its fiber and natural sugars." },
  { id: 7, category: "energy", type: "activity", question: "Touch your toes 5 times! This is how your muscles use energy from food." },
  { id: 8, category: "energy", type: "question", question: "Why do athletes eat pasta before a big game?", answer: "Pasta has carbohydrates that give your body energy for exercise." },
  { id: 9, category: "energy", type: "question", question: "What vitamin from the sun helps your bones grow strong?", answer: "Vitamin D!" },
  { id: 10, category: "energy", type: "question", question: "Name a food that helps build strong muscles.", answer: "Chicken, fish, eggs, beans, tofu, or any protein-rich food." },
  
  // Standard 2: Food Safety and Food Systems
  { id: 11, category: "safety", type: "question", question: "What should you do before you eat or help make food?", answer: "Wash your hands with soap and water for at least 20 seconds." },
  { id: 12, category: "safety", type: "question", question: "Where does the milk you drink come from?", answer: "From cows on dairy farms! Wisconsin has over 6,000 dairy farms." },
  { id: 13, category: "safety", type: "question", question: "True or False: It's okay to eat food that has fallen on the floor.", answer: "False! Germs can get on food instantly - the '5 second rule' is a myth." },
  { id: 14, category: "safety", type: "question", question: "Why should you wash fruits and vegetables before eating them?", answer: "To remove dirt, germs, and any chemicals that might be on them." },
  { id: 15, category: "safety", type: "question", question: "What color cutting board should you use for raw meat?", answer: "A separate cutting board (often red) to prevent spreading germs to other foods." },
  { id: 16, category: "safety", type: "question", question: "How can you tell if milk has gone bad?", answer: "It smells sour, looks chunky, or the expiration date has passed." },
  { id: 17, category: "safety", type: "activity", question: "Pretend to wash your hands! Rub them together for 20 seconds - that's how long you need!" },
  { id: 18, category: "safety", type: "question", question: "Where should you store raw chicken in the refrigerator?", answer: "On the bottom shelf so it doesn't drip onto other foods." },
  { id: 19, category: "safety", type: "question", question: "What does a farmer do?", answer: "Farmers grow crops and raise animals to produce the food we eat." },
  { id: 20, category: "safety", type: "question", question: "Name one way food gets from a farm to your table.", answer: "Trucks, trains, or ships transport food to stores where we buy it." },
  
  // Standard 3: Nutrition Literacy
  { id: 21, category: "literacy", type: "question", question: "What are the five food groups?", answer: "Fruits, Vegetables, Grains, Protein, and Dairy." },
  { id: 22, category: "literacy", type: "question", question: "Name three foods from the vegetable group.", answer: "Carrots, broccoli, spinach, corn, peas, tomatoes, peppers, etc." },
  { id: 23, category: "literacy", type: "question", question: "Name three foods from the dairy group.", answer: "Milk, cheese, yogurt, ice cream, butter." },
  { id: 24, category: "literacy", type: "activity", question: "Draw a circle in the air and divide it into 5 parts - one for each food group!" },
  { id: 25, category: "literacy", type: "question", question: "What does the nutrition label on food tell you?", answer: "How many calories, vitamins, and nutrients are in the food." },
  { id: 26, category: "literacy", type: "question", question: "Why should you eat foods from all five food groups?", answer: "Each group gives your body different nutrients it needs to be healthy." },
  { id: 27, category: "literacy", type: "question", question: "What is fiber and why is it good for you?", answer: "Fiber helps your digestive system work properly. It's in fruits, vegetables, and whole grains." },
  { id: 28, category: "literacy", type: "question", question: "Name a food that is high in protein.", answer: "Meat, fish, eggs, beans, nuts, tofu, or cheese." },
  { id: 29, category: "literacy", type: "question", question: "What mineral in milk helps build strong bones?", answer: "Calcium!" },
  { id: 30, category: "literacy", type: "question", question: "What should make up half your plate at every meal?", answer: "Fruits and vegetables!" },

  // Standard 4: Food, Nutrition, and Culture
  { id: 31, category: "culture", type: "question", question: "What is a traditional Wisconsin food?", answer: "Cheese curds, bratwurst, cranberries, fish fry, or frozen custard." },
  { id: 32, category: "culture", type: "question", question: "Name a food that is grown in Wisconsin.", answer: "Corn, potatoes, cranberries, ginseng, snap beans, cherries, or apples." },
  { id: 33, category: "culture", type: "question", question: "True or False: People all over the world eat the same foods.", answer: "False! Different cultures have different traditional foods and recipes." },
  { id: 34, category: "culture", type: "question", question: "What is Wisconsin's state fruit?", answer: "The cranberry! Wisconsin grows more cranberries than any other state." },
  { id: 35, category: "culture", type: "question", question: "Why is Wisconsin called 'America's Dairyland'?", answer: "Because Wisconsin produces more cheese than any other state!" },
  { id: 36, category: "culture", type: "question", question: "Name a food from another country that you've tried.", answer: "Pizza (Italy), tacos (Mexico), sushi (Japan), curry (India), etc." },
  { id: 37, category: "culture", type: "activity", question: "Tell the group about a special food your family eats for holidays!" },
  { id: 38, category: "culture", type: "question", question: "What is a Friday Fish Fry?", answer: "A Wisconsin tradition of eating fried fish on Friday nights, especially during Lent." },
  { id: 39, category: "culture", type: "question", question: "Name a vegetable that Native Americans taught early settlers to grow.", answer: "Corn, squash, or beans - known as the 'Three Sisters'." },
  { id: 40, category: "culture", type: "question", question: "What makes cheese curds squeak?", answer: "Fresh cheese curds squeak because of their protein structure and moisture content!" },

  // Standard 5: Health Enhancing Behaviors
  { id: 41, category: "health", type: "question", question: "What is one thing you can do every day to be healthy?", answer: "Eat fruits/veggies, exercise, drink water, get enough sleep, or wash hands." },
  { id: 42, category: "health", type: "question", question: "Why is it important to get enough sleep?", answer: "Sleep helps your body grow, heal, and gives your brain time to rest." },
  { id: 43, category: "health", type: "activity", question: "Do a silly dance for 10 seconds! Dancing is great exercise!" },
  { id: 44, category: "health", type: "question", question: "How many glasses of water should you drink each day?", answer: "About 6-8 glasses, or more if you're active or it's hot outside." },
  { id: 45, category: "health", type: "question", question: "Why is exercise important?", answer: "It makes your heart, muscles, and bones stronger and helps you feel happy." },
  { id: 46, category: "health", type: "activity", question: "Take 5 deep breaths! Deep breathing helps you relax and feel calm." },
  { id: 47, category: "health", type: "question", question: "What happens if you eat too much sugar?", answer: "It can cause cavities, weight gain, and make you feel tired after a sugar rush." },
  { id: 48, category: "health", type: "question", question: "Name a healthy drink besides water.", answer: "Milk, 100% fruit juice (in small amounts), or unsweetened tea." },
  { id: 49, category: "health", type: "activity", question: "Stand on one foot for 10 seconds! Balance is part of being healthy." },
  { id: 50, category: "health", type: "question", question: "Why should you limit screen time?", answer: "Too much screen time can hurt your eyes and take away from exercise and sleep." },

  // Standard 6: Identification and Classification
  { id: 51, category: "classification", type: "question", question: "Is a tomato a fruit or a vegetable?", answer: "Scientifically it's a fruit, but we usually eat it like a vegetable!" },
  { id: 52, category: "classification", type: "question", question: "Name a food that is a good source of protein.", answer: "Meat, beans, eggs, nuts, tofu, fish, or cheese." },
  { id: 53, category: "classification", type: "question", question: "Is a potato a vegetable?", answer: "Yes! It's a starchy vegetable that grows underground." },
  { id: 54, category: "classification", type: "question", question: "What food group does bread belong to?", answer: "The Grains group!" },
  { id: 55, category: "classification", type: "question", question: "Is peanut butter a protein or a fat?", answer: "It's both! Peanut butter has healthy fats AND protein." },
  { id: 56, category: "classification", type: "question", question: "Name three foods that are orange.", answer: "Carrots, oranges, sweet potatoes, pumpkins, mangoes, cantaloupe." },
  { id: 57, category: "classification", type: "question", question: "What makes whole grain bread healthier than white bread?", answer: "Whole grain has more fiber and nutrients because it uses the whole grain kernel." },
  { id: 58, category: "classification", type: "question", question: "Is cheese a protein or dairy?", answer: "It's dairy, but it also contains protein! Foods can belong to multiple groups." },
  { id: 59, category: "classification", type: "question", question: "Name a food that comes from a plant.", answer: "Fruits, vegetables, grains, nuts, beans - most foods come from plants!" },
  { id: 60, category: "classification", type: "question", question: "What's the difference between a fruit and a vegetable?", answer: "Fruits have seeds and come from flowers. Vegetables are other plant parts like leaves, stems, or roots." },
];

export const FUN_FACT_CARDS: FunFactCard[] = [
  { id: 1, fact: "Wisconsin is the #1 producer of cranberries in the United States, growing over 60% of the nation's supply!" },
  { id: 2, fact: "Wisconsin is called 'America's Dairyland' because it produces more cheese than any other state - over 3 billion pounds per year!" },
  { id: 3, fact: "The state fruit of Wisconsin is the cranberry, and the state grain is corn." },
  { id: 4, fact: "It takes about 10 pounds of milk to make just one pound of cheese!" },
  { id: 5, fact: "Carrots were originally purple, not orange! Orange carrots were developed in the Netherlands." },
  { id: 6, fact: "A strawberry is not actually a berry, but a banana is! Botanically speaking, berries have seeds inside." },
  { id: 7, fact: "The potato chip was invented by accident in 1853 when a chef made fries too thin!" },
  { id: 8, fact: "Wisconsin is home to the National Mustard Museum in Middleton, with over 6,000 mustards!" },
  { id: 9, fact: "The official state beverage of Wisconsin is milk." },
  { id: 10, fact: "Honey never spoils! Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible." },
  { id: 11, fact: "Wisconsin produces over 600 varieties of cheese - more than any other state!" },
  { id: 12, fact: "Apples float in water because they are 25% air!" },
  { id: 13, fact: "The average American eats about 35 pounds of cheese per year, but Wisconsinites eat even more!" },
  { id: 14, fact: "Broccoli is actually a flower that we eat before it blooms!" },
  { id: 15, fact: "Wisconsin's Door County is famous for its cherry orchards and produces millions of pounds of cherries each year." },
  { id: 16, fact: "A single ear of corn has about 800 kernels arranged in 16 rows!" },
  { id: 17, fact: "Cheese curds squeak against your teeth when they're fresh - the squeak goes away after a day or two." },
  { id: 18, fact: "Wisconsin has over 6,000 dairy farms and 1.2 million dairy cows!" },
  { id: 19, fact: "Cranberries don't actually grow in water - the bogs are flooded at harvest time to make picking easier." },
  { id: 20, fact: "The first ice cream sundae was invented in Two Rivers, Wisconsin in 1881!" },
  { id: 21, fact: "Peanuts aren't actually nuts - they're legumes that grow underground, like beans!" },
  { id: 22, fact: "Wisconsin grows more ginseng than any other state - most of it is exported to Asia." },
  { id: 23, fact: "Your taste buds are replaced every 10-14 days, which is why your food preferences can change!" },
  { id: 24, fact: "Cucumbers are 96% water - one of the most hydrating foods you can eat!" },
  { id: 25, fact: "The Green Bay Packers are the only NFL team owned by fans, and tailgating with brats is a beloved tradition!" },
];
