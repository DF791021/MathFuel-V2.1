import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

// ============================================================================
// DOMAINS
// ============================================================================
const domains = [
  { name: "Counting & Number Sense", slug: "counting", icon: "🔢", displayOrder: 1, gradeLevel: 1, description: "Count, compare, and order numbers up to 120" },
  { name: "Addition", slug: "addition", icon: "➕", displayOrder: 2, gradeLevel: 1, description: "Add numbers within 20 and beyond" },
  { name: "Subtraction", slug: "subtraction", icon: "➖", displayOrder: 3, gradeLevel: 1, description: "Subtract numbers within 20 and beyond" },
  { name: "Place Value", slug: "place-value", icon: "🏗️", displayOrder: 4, gradeLevel: 1, description: "Understand tens and ones" },
  { name: "Measurement & Data", slug: "measurement", icon: "📏", displayOrder: 5, gradeLevel: 1, description: "Measure length, tell time, and work with data" },
  { name: "Geometry", slug: "geometry", icon: "📐", displayOrder: 6, gradeLevel: 1, description: "Identify and describe shapes" },
  { name: "Word Problems", slug: "word-problems", icon: "📖", displayOrder: 7, gradeLevel: 1, description: "Solve real-world math stories" },
];

console.log('Seeding domains...');
const domainIds = {};
for (const d of domains) {
  const [result] = await conn.execute(
    `INSERT INTO mathDomains (name, slug, icon, displayOrder, gradeLevel, description) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [d.name, d.slug, d.icon, d.displayOrder, d.gradeLevel, d.description]
  );
  domainIds[d.slug] = result.insertId || (await conn.execute(`SELECT id FROM mathDomains WHERE slug = ?`, [d.slug]))[0][0].id;
  console.log(`  ✓ ${d.name} (id: ${domainIds[d.slug]})`);
}

// ============================================================================
// SKILLS
// ============================================================================
const skills = [
  // Counting
  { domain: "counting", name: "Count to 20", slug: "count-to-20", gradeLevel: 1, displayOrder: 1, description: "Count objects and numbers from 1 to 20" },
  { domain: "counting", name: "Count to 100", slug: "count-to-100", gradeLevel: 1, displayOrder: 2, description: "Count by 1s, 2s, 5s, and 10s to 100" },
  { domain: "counting", name: "Compare Numbers", slug: "compare-numbers", gradeLevel: 1, displayOrder: 3, description: "Use >, <, and = to compare numbers" },
  { domain: "counting", name: "Order Numbers", slug: "order-numbers", gradeLevel: 1, displayOrder: 4, description: "Put numbers in order from least to greatest" },
  
  // Addition
  { domain: "addition", name: "Add within 5", slug: "add-within-5", gradeLevel: 1, displayOrder: 1, description: "Add two numbers with sums up to 5" },
  { domain: "addition", name: "Add within 10", slug: "add-within-10", gradeLevel: 1, displayOrder: 2, description: "Add two numbers with sums up to 10" },
  { domain: "addition", name: "Add within 20", slug: "add-within-20", gradeLevel: 1, displayOrder: 3, description: "Add two numbers with sums up to 20" },
  { domain: "addition", name: "Doubles & Near Doubles", slug: "doubles", gradeLevel: 1, displayOrder: 4, description: "Learn doubles facts like 3+3 and near doubles like 3+4" },
  { domain: "addition", name: "Add within 100", slug: "add-within-100", gradeLevel: 2, displayOrder: 5, description: "Add two-digit numbers" },
  
  // Subtraction
  { domain: "subtraction", name: "Subtract within 5", slug: "subtract-within-5", gradeLevel: 1, displayOrder: 1, description: "Subtract with numbers up to 5" },
  { domain: "subtraction", name: "Subtract within 10", slug: "subtract-within-10", gradeLevel: 1, displayOrder: 2, description: "Subtract with numbers up to 10" },
  { domain: "subtraction", name: "Subtract within 20", slug: "subtract-within-20", gradeLevel: 1, displayOrder: 3, description: "Subtract with numbers up to 20" },
  { domain: "subtraction", name: "Subtract within 100", slug: "subtract-within-100", gradeLevel: 2, displayOrder: 4, description: "Subtract two-digit numbers" },
  
  // Place Value
  { domain: "place-value", name: "Tens and Ones", slug: "tens-and-ones", gradeLevel: 1, displayOrder: 1, description: "Break numbers into tens and ones" },
  { domain: "place-value", name: "Expanded Form", slug: "expanded-form", gradeLevel: 2, displayOrder: 2, description: "Write numbers in expanded form (34 = 30 + 4)" },
  { domain: "place-value", name: "Hundreds, Tens, Ones", slug: "hundreds-tens-ones", gradeLevel: 2, displayOrder: 3, description: "Understand 3-digit place value" },
  
  // Measurement
  { domain: "measurement", name: "Compare Lengths", slug: "compare-lengths", gradeLevel: 1, displayOrder: 1, description: "Compare objects by length (longer, shorter)" },
  { domain: "measurement", name: "Tell Time", slug: "tell-time", gradeLevel: 1, displayOrder: 2, description: "Read clocks to the hour and half hour" },
  { domain: "measurement", name: "Count Money", slug: "count-money", gradeLevel: 2, displayOrder: 3, description: "Count coins and dollar bills" },
  
  // Geometry
  { domain: "geometry", name: "2D Shapes", slug: "2d-shapes", gradeLevel: 1, displayOrder: 1, description: "Identify circles, squares, triangles, rectangles" },
  { domain: "geometry", name: "3D Shapes", slug: "3d-shapes", gradeLevel: 1, displayOrder: 2, description: "Identify cubes, spheres, cones, cylinders" },
  
  // Word Problems
  { domain: "word-problems", name: "Addition Stories", slug: "addition-stories", gradeLevel: 1, displayOrder: 1, description: "Solve word problems using addition" },
  { domain: "word-problems", name: "Subtraction Stories", slug: "subtraction-stories", gradeLevel: 1, displayOrder: 2, description: "Solve word problems using subtraction" },
  { domain: "word-problems", name: "Mixed Stories", slug: "mixed-stories", gradeLevel: 2, displayOrder: 3, description: "Choose addition or subtraction to solve" },
];

console.log('\nSeeding skills...');
const skillIds = {};
for (const s of skills) {
  const domainId = domainIds[s.domain];
  const [result] = await conn.execute(
    `INSERT INTO mathSkills (domainId, name, slug, gradeLevel, displayOrder, description) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [domainId, s.name, s.slug, s.gradeLevel, s.displayOrder, s.description]
  );
  skillIds[s.slug] = result.insertId || (await conn.execute(`SELECT id FROM mathSkills WHERE slug = ?`, [s.slug]))[0][0].id;
  console.log(`  ✓ ${s.name} (id: ${skillIds[s.slug]})`);
}

// ============================================================================
// PROBLEMS - Comprehensive seed for each skill
// ============================================================================
function mc(q, correct, choices, explanation, hints, diff = 1, tags = "") {
  return { problemType: "multiple_choice", answerType: "choice", questionText: q, correctAnswer: correct, choices: JSON.stringify(choices), explanation, hintSteps: JSON.stringify(hints), difficulty: diff, tags };
}
function num(q, correct, explanation, hints, diff = 1, tags = "") {
  return { problemType: "numeric_input", answerType: "number", questionText: q, correctAnswer: String(correct), choices: null, explanation, hintSteps: JSON.stringify(hints), difficulty: diff, tags };
}
function tf(q, correct, explanation, hints, diff = 1, tags = "") {
  return { problemType: "true_false", answerType: "boolean", questionText: q, correctAnswer: correct ? "true" : "false", choices: JSON.stringify(["True", "False"]), explanation, hintSteps: JSON.stringify(hints), difficulty: diff, tags };
}
function comp(q, correct, choices, explanation, hints, diff = 1, tags = "") {
  return { problemType: "comparison", answerType: "choice", questionText: q, correctAnswer: correct, choices: JSON.stringify(choices), explanation, hintSteps: JSON.stringify(hints), difficulty: diff, tags };
}
function wp(q, correct, explanation, hints, diff = 2, tags = "") {
  return { problemType: "word_problem", answerType: "number", questionText: q, correctAnswer: String(correct), choices: null, explanation, hintSteps: JSON.stringify(hints), difficulty: diff, tags };
}

const problems = {
  "count-to-20": [
    num("How many stars? ⭐⭐⭐⭐⭐", 5, "There are 5 stars!", ["Count each star one by one.", "Point to each star as you count: 1, 2, 3, 4, 5"], 1, "counting,visual"),
    num("What number comes after 7?", 8, "8 comes after 7!", ["Think about counting: 5, 6, 7, ...", "The next number after 7 is 8"], 1, "counting,sequence"),
    num("What number comes before 12?", 11, "11 comes before 12!", ["Count up: 10, 11, 12", "The number just before 12 is 11"], 1, "counting,sequence"),
    num("Count the hearts: ❤️❤️❤️❤️❤️❤️❤️", 7, "There are 7 hearts!", ["Count each heart slowly.", "1, 2, 3, 4, 5, 6, 7"], 1, "counting,visual"),
    mc("What number is missing? 3, 4, __, 6", "5", ["4", "5", "7", "8"], "5 goes between 4 and 6!", ["Count: 3, 4, then what comes next?", "After 4 comes 5, then 6"], 2, "counting,sequence"),
    num("How many fingers on two hands?", 10, "We have 10 fingers on two hands!", ["Count the fingers on one hand: 5", "Now add the other hand: 5 + 5 = 10"], 1, "counting"),
    num("What number comes after 15?", 16, "16 comes after 15!", ["Count: 13, 14, 15, ...", "The next number is 16"], 2, "counting,sequence"),
    mc("Which group has more? 🍎🍎🍎 or 🍊🍊🍊🍊🍊", "🍊🍊🍊🍊🍊", ["🍎🍎🍎", "🍊🍊🍊🍊🍊", "They are equal"], "5 oranges is more than 3 apples!", ["Count the apples: 3", "Count the oranges: 5. Which is bigger?"], 1, "counting,comparing"),
    num("Count by 2s: 2, 4, 6, __", 8, "2, 4, 6, 8! Skip counting by 2s.", ["We're adding 2 each time.", "6 + 2 = 8"], 2, "counting,skip-counting"),
    num("What number is 1 more than 19?", 20, "19 + 1 = 20!", ["Start at 19 and count one more.", "19, 20!"], 2, "counting"),
  ],
  "count-to-100": [
    num("Count by 10s: 10, 20, 30, __", 40, "10, 20, 30, 40! We add 10 each time.", ["We're skip counting by 10.", "30 + 10 = 40"], 2, "counting,skip-counting"),
    num("Count by 5s: 5, 10, 15, 20, __", 25, "5, 10, 15, 20, 25!", ["We add 5 each time.", "20 + 5 = 25"], 2, "counting,skip-counting"),
    num("What number comes after 49?", 50, "50 comes after 49!", ["Count: 48, 49, ...", "The next number is 50"], 2, "counting,sequence"),
    num("What number comes after 99?", 100, "100 comes after 99!", ["99 is the last two-digit number.", "The next number is 100!"], 3, "counting,sequence"),
    mc("Which is bigger: 45 or 54?", "54", ["45", "54", "They are equal"], "54 is bigger than 45!", ["Look at the tens digit first.", "45 has 4 tens, 54 has 5 tens. 5 > 4."], 3, "counting,comparing"),
  ],
  "compare-numbers": [
    comp("Which symbol goes between 5 and 8? 5 __ 8", "<", [">", "<", "="], "5 is less than 8, so we use <", ["Is 5 bigger, smaller, or equal to 8?", "5 is smaller, so the open side points to the bigger number: 5 < 8"], 2, "comparing"),
    comp("Which symbol goes between 12 and 12? 12 __ 12", "=", [">", "<", "="], "12 equals 12!", ["Are these numbers the same?", "Yes! 12 = 12"], 1, "comparing"),
    comp("Which symbol goes between 9 and 3? 9 __ 3", ">", [">", "<", "="], "9 is greater than 3, so we use >", ["Is 9 bigger or smaller than 3?", "9 is bigger! The open side points to 9: 9 > 3"], 2, "comparing"),
    mc("Which number is the smallest: 15, 8, 22?", "8", ["15", "8", "22"], "8 is the smallest!", ["Compare each number.", "8 < 15 < 22, so 8 is smallest"], 3, "comparing"),
    tf("True or false: 7 > 10", false, "False! 7 is less than 10.", ["Is 7 bigger than 10?", "No, 7 < 10"], 2, "comparing"),
  ],
  "order-numbers": [
    mc("Put in order from least to greatest: 5, 2, 8", "2, 5, 8", ["8, 5, 2", "2, 5, 8", "5, 2, 8"], "2, 5, 8 goes from smallest to biggest!", ["Find the smallest number first.", "2 is smallest, then 5, then 8"], 2, "ordering"),
    mc("Put in order from least to greatest: 14, 7, 21", "7, 14, 21", ["21, 14, 7", "7, 14, 21", "14, 7, 21"], "7, 14, 21!", ["Which is the smallest?", "7 < 14 < 21"], 3, "ordering"),
    mc("What comes next? 2, 4, 6, 8, __", "10", ["9", "10", "12"], "The pattern is counting by 2s: 10 comes next!", ["What are we adding each time?", "We add 2: 8 + 2 = 10"], 2, "ordering,patterns"),
  ],
  "add-within-5": [
    num("1 + 1 = ?", 2, "1 + 1 = 2!", ["Hold up 1 finger, then 1 more.", "Count them all: 2!"], 1, "addition"),
    num("2 + 1 = ?", 3, "2 + 1 = 3!", ["Start at 2, count up 1 more.", "2, 3!"], 1, "addition"),
    num("2 + 2 = ?", 4, "2 + 2 = 4!", ["Hold up 2 fingers on each hand.", "Count them all: 1, 2, 3, 4!"], 1, "addition"),
    num("3 + 2 = ?", 5, "3 + 2 = 5!", ["Start at 3, count up 2 more.", "3, 4, 5!"], 1, "addition"),
    num("1 + 4 = ?", 5, "1 + 4 = 5!", ["Start with the bigger number: 4.", "Count up 1 more: 5!"], 1, "addition"),
    num("0 + 3 = ?", 3, "0 + 3 = 3! Adding zero doesn't change the number.", ["Zero means nothing added.", "So 0 + 3 is just 3!"], 1, "addition,zero"),
    num("2 + 3 = ?", 5, "2 + 3 = 5!", ["Start at 3, count up 2.", "3, 4, 5!"], 1, "addition"),
    num("4 + 1 = ?", 5, "4 + 1 = 5!", ["Start at 4, count 1 more.", "4, 5!"], 1, "addition"),
  ],
  "add-within-10": [
    num("3 + 4 = ?", 7, "3 + 4 = 7!", ["Start at 4, count up 3.", "4, 5, 6, 7!"], 1, "addition"),
    num("5 + 5 = ?", 10, "5 + 5 = 10! This is a doubles fact.", ["5 fingers + 5 fingers.", "That's 10!"], 1, "addition,doubles"),
    num("6 + 3 = ?", 9, "6 + 3 = 9!", ["Start at 6, count up 3.", "6, 7, 8, 9!"], 2, "addition"),
    num("4 + 4 = ?", 8, "4 + 4 = 8! Another doubles fact.", ["Double 4 means 4 + 4.", "That's 8!"], 1, "addition,doubles"),
    num("7 + 2 = ?", 9, "7 + 2 = 9!", ["Start at 7, count up 2.", "7, 8, 9!"], 2, "addition"),
    num("8 + 2 = ?", 10, "8 + 2 = 10!", ["Start at 8, count up 2.", "8, 9, 10!"], 2, "addition"),
    num("6 + 4 = ?", 10, "6 + 4 = 10! They make a 10 together.", ["6 needs 4 more to make 10.", "6 + 4 = 10!"], 2, "addition,make-ten"),
    num("3 + 7 = ?", 10, "3 + 7 = 10!", ["3 and 7 are partners that make 10.", "3 + 7 = 10!"], 2, "addition,make-ten"),
  ],
  "add-within-20": [
    num("9 + 3 = ?", 12, "9 + 3 = 12!", ["Make a 10 first: 9 + 1 = 10.", "Then add the leftover 2: 10 + 2 = 12!"], 2, "addition,make-ten"),
    num("8 + 5 = ?", 13, "8 + 5 = 13!", ["Make a 10: 8 + 2 = 10.", "Leftover: 5 - 2 = 3. So 10 + 3 = 13!"], 3, "addition,make-ten"),
    num("7 + 6 = ?", 13, "7 + 6 = 13!", ["Think: 7 + 3 = 10, then 3 more = 13.", "Or: double 6 is 12, plus 1 = 13."], 3, "addition"),
    num("9 + 9 = ?", 18, "9 + 9 = 18!", ["Double 9: 9 + 9.", "Think: 10 + 10 = 20, minus 2 = 18!"], 3, "addition,doubles"),
    num("8 + 7 = ?", 15, "8 + 7 = 15!", ["Make a 10: 8 + 2 = 10.", "Leftover: 7 - 2 = 5. So 10 + 5 = 15!"], 3, "addition,make-ten"),
    num("6 + 8 = ?", 14, "6 + 8 = 14!", ["Start with 8, add 6.", "8 + 2 = 10, then 4 more = 14!"], 3, "addition"),
  ],
  "doubles": [
    num("1 + 1 = ?", 2, "Double 1 is 2!", ["1 + 1 means two 1s.", "That's 2!"], 1, "addition,doubles"),
    num("3 + 3 = ?", 6, "Double 3 is 6!", ["3 + 3 means two groups of 3.", "That's 6!"], 1, "addition,doubles"),
    num("5 + 5 = ?", 10, "Double 5 is 10!", ["5 fingers + 5 fingers.", "That's 10!"], 1, "addition,doubles"),
    num("4 + 5 = ?", 9, "4 + 5 = 9! Near doubles: 4 + 4 + 1", ["This is close to 4 + 4 = 8.", "Just add 1 more: 8 + 1 = 9!"], 2, "addition,near-doubles"),
    num("6 + 7 = ?", 13, "6 + 7 = 13! Near doubles: 6 + 6 + 1", ["This is close to 6 + 6 = 12.", "Just add 1 more: 12 + 1 = 13!"], 3, "addition,near-doubles"),
    num("7 + 7 = ?", 14, "Double 7 is 14!", ["7 + 7 means two 7s.", "That's 14!"], 2, "addition,doubles"),
    num("8 + 8 = ?", 16, "Double 8 is 16!", ["8 + 8 means two 8s.", "That's 16!"], 2, "addition,doubles"),
  ],
  "add-within-100": [
    num("20 + 30 = ?", 50, "20 + 30 = 50!", ["Add the tens: 2 tens + 3 tens = 5 tens.", "5 tens = 50!"], 2, "addition,tens"),
    num("45 + 10 = ?", 55, "45 + 10 = 55!", ["Adding 10 means the tens digit goes up by 1.", "4 tens becomes 5 tens: 55!"], 2, "addition"),
    num("34 + 25 = ?", 59, "34 + 25 = 59!", ["Add ones: 4 + 5 = 9.", "Add tens: 30 + 20 = 50. Total: 59!"], 3, "addition,two-digit"),
    num("47 + 36 = ?", 83, "47 + 36 = 83!", ["Add ones: 7 + 6 = 13. Write 3, carry 1.", "Add tens: 4 + 3 + 1 = 8. Answer: 83!"], 4, "addition,regrouping"),
    num("58 + 27 = ?", 85, "58 + 27 = 85!", ["Add ones: 8 + 7 = 15. Write 5, carry 1.", "Add tens: 5 + 2 + 1 = 8. Answer: 85!"], 4, "addition,regrouping"),
  ],
  "subtract-within-5": [
    num("3 - 1 = ?", 2, "3 - 1 = 2!", ["Start at 3, take away 1.", "3, 2!"], 1, "subtraction"),
    num("5 - 2 = ?", 3, "5 - 2 = 3!", ["Start at 5, count back 2.", "5, 4, 3!"], 1, "subtraction"),
    num("4 - 4 = ?", 0, "4 - 4 = 0! Take away all of them.", ["If you have 4 and take away 4...", "You have nothing left: 0!"], 1, "subtraction,zero"),
    num("5 - 3 = ?", 2, "5 - 3 = 2!", ["Start at 5, count back 3.", "5, 4, 3, 2!"], 1, "subtraction"),
    num("4 - 2 = ?", 2, "4 - 2 = 2!", ["Start at 4, take away 2.", "4, 3, 2!"], 1, "subtraction"),
    num("5 - 0 = ?", 5, "5 - 0 = 5! Subtracting zero changes nothing.", ["Taking away 0 means taking away nothing.", "So you still have 5!"], 1, "subtraction,zero"),
  ],
  "subtract-within-10": [
    num("7 - 3 = ?", 4, "7 - 3 = 4!", ["Start at 7, count back 3.", "7, 6, 5, 4!"], 2, "subtraction"),
    num("10 - 4 = ?", 6, "10 - 4 = 6!", ["Start at 10, count back 4.", "10, 9, 8, 7, 6!"], 2, "subtraction"),
    num("8 - 5 = ?", 3, "8 - 5 = 3!", ["Start at 8, count back 5.", "Or think: 5 + ? = 8. Answer: 3!"], 2, "subtraction"),
    num("9 - 6 = ?", 3, "9 - 6 = 3!", ["Think: 6 + ? = 9.", "6 + 3 = 9, so 9 - 6 = 3!"], 2, "subtraction"),
    num("10 - 7 = ?", 3, "10 - 7 = 3!", ["Think about number pairs that make 10.", "7 + 3 = 10, so 10 - 7 = 3!"], 2, "subtraction,make-ten"),
    num("6 - 6 = ?", 0, "6 - 6 = 0!", ["Any number minus itself is 0.", "6 - 6 = 0!"], 1, "subtraction,zero"),
  ],
  "subtract-within-20": [
    num("13 - 5 = ?", 8, "13 - 5 = 8!", ["Break it up: 13 - 3 = 10.", "Then 10 - 2 = 8!"], 3, "subtraction"),
    num("15 - 7 = ?", 8, "15 - 7 = 8!", ["Break it up: 15 - 5 = 10.", "Then 10 - 2 = 8!"], 3, "subtraction"),
    num("17 - 9 = ?", 8, "17 - 9 = 8!", ["Think: 9 + ? = 17.", "9 + 8 = 17, so 17 - 9 = 8!"], 3, "subtraction"),
    num("14 - 6 = ?", 8, "14 - 6 = 8!", ["Break it up: 14 - 4 = 10.", "Then 10 - 2 = 8!"], 3, "subtraction"),
    num("18 - 9 = ?", 9, "18 - 9 = 9! Half of 18.", ["Double 9 is 18.", "So 18 - 9 = 9!"], 3, "subtraction,doubles"),
    num("16 - 8 = ?", 8, "16 - 8 = 8! Half of 16.", ["Double 8 is 16.", "So 16 - 8 = 8!"], 3, "subtraction,doubles"),
  ],
  "subtract-within-100": [
    num("50 - 20 = ?", 30, "50 - 20 = 30!", ["Subtract tens: 5 tens - 2 tens = 3 tens.", "3 tens = 30!"], 2, "subtraction,tens"),
    num("67 - 30 = ?", 37, "67 - 30 = 37!", ["Subtract the tens: 6 tens - 3 tens = 3 tens.", "Keep the ones: 37!"], 3, "subtraction"),
    num("85 - 42 = ?", 43, "85 - 42 = 43!", ["Subtract ones: 5 - 2 = 3.", "Subtract tens: 8 - 4 = 4. Answer: 43!"], 4, "subtraction,two-digit"),
    num("73 - 28 = ?", 45, "73 - 28 = 45!", ["Can't subtract 8 from 3, so borrow.", "13 - 8 = 5. 6 - 2 = 4. Answer: 45!"], 5, "subtraction,regrouping"),
  ],
  "tens-and-ones": [
    num("How many tens in 34?", 3, "34 has 3 tens and 4 ones!", ["The tens digit is on the left.", "In 34, the 3 means 3 tens."], 2, "place-value"),
    num("How many ones in 27?", 7, "27 has 2 tens and 7 ones!", ["The ones digit is on the right.", "In 27, the 7 means 7 ones."], 2, "place-value"),
    num("What number has 4 tens and 5 ones?", 45, "4 tens and 5 ones = 45!", ["4 tens = 40.", "40 + 5 = 45!"], 2, "place-value"),
    num("What number has 7 tens and 0 ones?", 70, "7 tens and 0 ones = 70!", ["7 tens = 70.", "70 + 0 = 70!"], 2, "place-value"),
    mc("Which shows 56 in tens and ones?", "5 tens 6 ones", ["6 tens 5 ones", "5 tens 6 ones", "56 tens 0 ones"], "56 = 5 tens and 6 ones!", ["The first digit is tens.", "5 is in the tens place, 6 is in the ones place."], 2, "place-value"),
  ],
  "expanded-form": [
    num("Write 43 in expanded form: 40 + ?", 3, "43 = 40 + 3!", ["43 has 4 tens (40) and 3 ones.", "So 43 = 40 + 3!"], 2, "place-value,expanded"),
    mc("What is the expanded form of 67?", "60 + 7", ["6 + 7", "60 + 7", "67 + 0"], "67 = 60 + 7!", ["Break it into tens and ones.", "6 tens = 60, 7 ones = 7."], 2, "place-value,expanded"),
    num("25 = 20 + ?", 5, "25 = 20 + 5!", ["25 has 2 tens and 5 ones.", "20 + 5 = 25!"], 2, "place-value,expanded"),
    num("What is 30 + 8?", 38, "30 + 8 = 38!", ["3 tens + 8 ones.", "That's 38!"], 2, "place-value,expanded"),
  ],
  "hundreds-tens-ones": [
    num("How many hundreds in 345?", 3, "345 has 3 hundreds!", ["The hundreds digit is the leftmost.", "In 345, the 3 means 3 hundreds (300)."], 3, "place-value"),
    num("What number has 2 hundreds, 5 tens, 1 one?", 251, "2 hundreds, 5 tens, 1 one = 251!", ["200 + 50 + 1.", "That's 251!"], 3, "place-value"),
    mc("What is the value of the 4 in 482?", "400", ["4", "40", "400"], "The 4 is in the hundreds place, so it's worth 400!", ["What place is the 4 in?", "It's in the hundreds place: 4 × 100 = 400."], 3, "place-value"),
  ],
  "compare-lengths": [
    mc("Which is longer: a pencil or a school bus?", "A school bus", ["A pencil", "A school bus", "They are the same"], "A school bus is much longer than a pencil!", ["Think about how big each one is.", "A school bus is very long!"], 1, "measurement,length"),
    mc("Which is shorter: a cat or a giraffe?", "A cat", ["A cat", "A giraffe", "They are the same"], "A cat is shorter than a giraffe!", ["Think about how tall each animal is.", "Cats are small, giraffes are very tall!"], 1, "measurement,length"),
    tf("True or false: A book is longer than a car.", false, "False! A car is much longer than a book.", ["Think about the size of each.", "A car is much bigger!"], 1, "measurement,length"),
  ],
  "tell-time": [
    mc("What time does the clock show when the big hand is on 12 and the small hand is on 3?", "3:00", ["3:00", "12:03", "3:30"], "When the big hand is on 12, it's exactly on the hour. The small hand on 3 means 3:00!", ["The big hand on 12 means 'o'clock'.", "The small hand points to the hour: 3."], 2, "measurement,time"),
    mc("What time is it when the big hand is on 6 and the small hand is between 7 and 8?", "7:30", ["6:07", "7:30", "8:30"], "The big hand on 6 means half past. The small hand between 7 and 8 means 7:30!", ["Big hand on 6 = 30 minutes (half past).", "Small hand between 7 and 8 = 7:30."], 3, "measurement,time"),
  ],
  "count-money": [
    num("How many cents is 1 nickel?", 5, "1 nickel = 5 cents!", ["A nickel is worth 5 cents.", "5¢!"], 2, "measurement,money"),
    num("How many cents is 1 dime?", 10, "1 dime = 10 cents!", ["A dime is worth 10 cents.", "10¢!"], 2, "measurement,money"),
    num("How many cents are 2 dimes and 1 nickel?", 25, "2 dimes + 1 nickel = 25 cents!", ["2 dimes = 20 cents.", "20 + 5 = 25 cents!"], 3, "measurement,money"),
    num("How many cents is 1 quarter?", 25, "1 quarter = 25 cents!", ["A quarter is worth 25 cents.", "25¢!"], 2, "measurement,money"),
  ],
  "2d-shapes": [
    mc("How many sides does a triangle have?", "3", ["2", "3", "4", "5"], "A triangle has 3 sides!", ["Tri means three.", "Count the sides: 1, 2, 3!"], 1, "geometry,shapes"),
    mc("What shape has 4 equal sides?", "Square", ["Circle", "Triangle", "Square", "Rectangle"], "A square has 4 equal sides!", ["Which shape has 4 sides that are all the same length?", "That's a square!"], 1, "geometry,shapes"),
    mc("How many corners does a circle have?", "0", ["0", "1", "2", "4"], "A circle has 0 corners — it's perfectly round!", ["Does a circle have any pointy parts?", "No! A circle is smooth all around."], 1, "geometry,shapes"),
    tf("True or false: A rectangle has 4 sides.", true, "True! A rectangle has 4 sides.", ["Count the sides of a rectangle.", "1, 2, 3, 4 — yes, 4 sides!"], 1, "geometry,shapes"),
    num("How many sides does a hexagon have?", 6, "A hexagon has 6 sides!", ["Hex means six.", "Count: 1, 2, 3, 4, 5, 6!"], 2, "geometry,shapes"),
  ],
  "3d-shapes": [
    mc("What shape is a ball?", "Sphere", ["Cube", "Sphere", "Cone", "Cylinder"], "A ball is a sphere!", ["A ball is round in every direction.", "That's called a sphere!"], 1, "geometry,3d"),
    mc("What shape is a box?", "Cube", ["Sphere", "Cone", "Cube", "Cylinder"], "A box is shaped like a cube!", ["A box has flat faces and square sides.", "That's a cube!"], 1, "geometry,3d"),
    mc("What shape is an ice cream cone?", "Cone", ["Cube", "Sphere", "Cone", "Cylinder"], "An ice cream cone is a cone shape!", ["It has a point at the bottom and a circle at the top.", "That's a cone!"], 1, "geometry,3d"),
    mc("What shape is a soup can?", "Cylinder", ["Cube", "Sphere", "Cone", "Cylinder"], "A soup can is a cylinder!", ["It has circles on top and bottom.", "That's a cylinder!"], 2, "geometry,3d"),
  ],
  "addition-stories": [
    wp("Sam has 3 apples. He gets 4 more. How many apples does Sam have now?", 7, "3 + 4 = 7 apples!", ["Sam starts with 3 and gets more.", "This is addition: 3 + 4 = 7!"], 2, "word-problem,addition"),
    wp("There are 5 birds in a tree. 3 more birds fly in. How many birds are there now?", 8, "5 + 3 = 8 birds!", ["Start with 5 birds, then more come.", "5 + 3 = 8!"], 2, "word-problem,addition"),
    wp("Maya has 6 stickers. Her friend gives her 5 more. How many stickers does Maya have?", 11, "6 + 5 = 11 stickers!", ["Maya starts with 6 and gets more.", "6 + 5 = 11!"], 3, "word-problem,addition"),
    wp("There are 8 red cars and 7 blue cars. How many cars are there in all?", 15, "8 + 7 = 15 cars!", ["We need to find the total.", "8 + 7 = 15!"], 3, "word-problem,addition"),
  ],
  "subtraction-stories": [
    wp("Tom has 8 cookies. He eats 3. How many cookies are left?", 5, "8 - 3 = 5 cookies left!", ["Tom starts with 8 and eats some.", "This is subtraction: 8 - 3 = 5!"], 2, "word-problem,subtraction"),
    wp("There are 10 ducks in a pond. 4 swim away. How many ducks are left?", 6, "10 - 4 = 6 ducks!", ["Start with 10, some leave.", "10 - 4 = 6!"], 2, "word-problem,subtraction"),
    wp("Lily has 15 crayons. She gives 7 to her friend. How many does she have left?", 8, "15 - 7 = 8 crayons!", ["Lily starts with 15 and gives some away.", "15 - 7 = 8!"], 3, "word-problem,subtraction"),
    wp("There were 12 balloons. 5 popped. How many are left?", 7, "12 - 5 = 7 balloons!", ["Start with 12, some pop.", "12 - 5 = 7!"], 3, "word-problem,subtraction"),
  ],
  "mixed-stories": [
    wp("Jake has 9 marbles. He finds 6 more, then loses 4. How many does he have?", 11, "9 + 6 = 15, then 15 - 4 = 11!", ["First add: 9 + 6 = 15.", "Then subtract: 15 - 4 = 11!"], 4, "word-problem,mixed"),
    wp("A bus has 14 people. 5 get off and 3 get on. How many people are on the bus?", 12, "14 - 5 = 9, then 9 + 3 = 12!", ["First subtract: 14 - 5 = 9.", "Then add: 9 + 3 = 12!"], 4, "word-problem,mixed"),
    wp("Sara has 7 red flowers and 8 yellow flowers. She gives away 5. How many does she have?", 10, "7 + 8 = 15, then 15 - 5 = 10!", ["First find the total: 7 + 8 = 15.", "Then subtract: 15 - 5 = 10!"], 4, "word-problem,mixed"),
  ],
};

console.log('\nSeeding problems...');
let totalProblems = 0;
for (const [skillSlug, probs] of Object.entries(problems)) {
  const skillId = skillIds[skillSlug];
  if (!skillId) {
    console.error(`  ✗ Skill not found: ${skillSlug}`);
    continue;
  }
  for (const p of probs) {
    await conn.execute(
      `INSERT INTO mathProblems (skillId, problemType, difficulty, questionText, correctAnswer, answerType, choices, explanation, hintSteps, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [skillId, p.problemType, p.difficulty, p.questionText, p.correctAnswer, p.answerType, p.choices, p.explanation, p.hintSteps, p.tags]
    );
    totalProblems++;
  }
  console.log(`  ✓ ${skillSlug}: ${probs.length} problems`);
}

console.log(`\nSeeding complete! ${totalProblems} problems created across ${Object.keys(skillIds).length} skills.`);
await conn.end();
