// Current brittle parsing logic
function currentParse(output) {
  return output
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .join('\n')
    .trim();
}

// Robust parsing logic
function robustParse(output) {
  try {
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      if (Array.isArray(data.lessons)) {
        return data.lessons.map(l => `- ${l}`).join('\n');
      }
    }
  } catch (e) {
    console.error('JSON Parse Error:', e.message);
  }
  return '';
}

const inputs = [
  "Here is the reflection:\n- Lesson A\n- Lesson B",
  "1. Lesson A\n2. Lesson B", // Current fails this
  "{\"lessons\": [\"Lesson A\", \"Lesson B\"]}", // Robust handles this
  "Some preamble {\"lessons\": [\"Lesson A\", \"Lesson B\"]} some postamble" // Robust handles this
];

console.log('--- Current Brittle Logic ---');
inputs.forEach((input, i) => {
  console.log(`Input ${i}: "${currentParse(input)}"`);
});

console.log('\n--- New Robust Logic ---');
inputs.forEach((input, i) => {
  console.log(`Input ${i}: "${robustParse(input)}"`);
});
