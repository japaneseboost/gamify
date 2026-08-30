export type GeneratedSection = {
  heading: string;
  note?: string;
  items: string[];
};

export type GeneratedActivity = {
  id: string;
  activityId: string;
  title: string;
  targetVocabulary: string;
  targetGrammar: string;
  subtitle: string;
  objective: string;
  time: string;
  preparation: string[];
  sections: GeneratedSection[];
  differentiation: string[];
  nextStep: string;
};

type GeneratorInput = {
  activityId: string;
  activityTitle: string;
  vocabulary: string;
  grammar: string;
  yearLevel: string;
  support: string;
  duration: string;
  participation: string;
  energy: string;
};

const cleanList = (value: string) => value.split(/[、,\n]/).map((item) => item.trim()).filter(Boolean);

const frame = (word: string, grammar: string) => {
  if (!grammar.trim()) return word;
  const firstPattern = grammar.split(/(?:／|\/|\n)/)[0].trim();
  return firstPattern.includes("～") ? firstPattern.replace("～", word) : `${word}${firstPattern}`;
};

const details = (input: GeneratorInput) => {
  const words = cleanList(input.vocabulary);
  const safeWords = words.length ? words : ["ラーメン", "すし", "カレー"];
  const [one, two = safeWords[0], three = safeWords[1] ?? safeWords[0]] = safeWords;
  const target = input.grammar.trim() || "the target vocabulary in a complete message";
  return { words: safeWords, one, two, three, target };
};

const shared = (input: GeneratorInput) => {
  const d = details(input);
  return {
    subtitle: `Year ${input.yearLevel} · ${input.support} support · ${input.duration} · ${input.participation}`,
    objective: `Students will understand and respond to repeated, meaningful uses of ${d.target}.`,
    differentiation: [
      `Support: let students point, vote or answer with one word before requiring ${frame(d.one, input.grammar)}.`,
      `Core: provide the frame “${frame("＿＿＿", input.grammar)}” and ask students to change one detail.`,
      `Extend: ask a reason or follow-up question without introducing more than one new structure.`,
    ],
    nextStep: "Reuse the class’s answers in a short reading next lesson so familiar oral language becomes accessible text.",
  };
};

export function generateActivity(input: GeneratorInput): GeneratedActivity {
  const d = details(input);
  const base = shared(input);
  const time = input.duration;
  const id = `${input.activityId}-${Date.now()}`;
  const prep = input.energy === "calm" ? "Keep response routines calm and predictable." : "Leave space for quick whole-class voting.";
  const sentence = (word: string) => frame(word, input.grammar);
  const question = (word: string) => `「${sentence(word)}か。」`;

  const variants: Record<string, Omit<GeneratedActivity, "id" | "subtitle" | "objective" | "time" | "differentiation" | "nextStep">> = {
    pqa: {
      title: "Personal questions",
      preparation: ["Display the target language where everyone can see it.", `Choose 3–4 familiar class interests connected to: ${d.words.join("、")}.`, prep],
      sections: [
        { heading: "Open with an easy win", note: "Accept gestures or one-word answers first.", items: [`Ask: ${question(d.one)}`, "Students show thumbs up/down. Confirm: 「そうですか。いいですね。」", `Circle the meaning: 「${d.one}？${d.two}？」`] },
        { heading: "Personalise and recycle", note: "Listen to the answer; the conversation matters more than finishing every question.", items: [`Ask one student: ${question(d.one)}`, `Follow up with a choice: 「${d.one}？${d.two}？」`, `Ask the class to verify: 「みなさん、Alexさんは${sentence(d.two)}か。」`, "Confirm the answer, then repeat the same pattern with two more students."] },
        { heading: "Finish with a class discovery", items: [`Vote: 「クラスで、${d.one}と${d.two}と、どちらが人気(にんき)ですか。」`, "State the result in Japanese twice, then ask students to tell a partner what they understood."] },
      ],
    },
    "special-person": {
      title: "Special person interview",
      preparation: ["Choose a willing student and seat them where the class can see them.", "Display the core answer frame.", prep],
      sections: [
        { heading: "Interview", items: [`Start: ${question(d.one)}`, `Offer a choice: 「${d.two}？${d.three}？」`, "Ask one natural follow-up based on the student’s answer."] },
        { heading: "Turn back to the class", items: ["Ask true/false questions about the student.", `Verify: 「Alexさんは${sentence(d.one)}か。」`, "Invite the class to correct one deliberately silly statement."] },
        { heading: "Micro-retell", items: ["Students tell a partner two remembered facts.", "Invite one confident student to retell; recast errors without interrupting the message."] },
      ],
    },
    "co-created-story": {
      title: "Co-created story",
      preparation: ["Draw three boxes: character, desire, problem.", `Keep these words visible: ${d.words.join("、")}.`, "Prepare two plausible choices and one playful choice for each story decision."],
      sections: [
        { heading: "Establish the character", note: "Students choose within boundaries; you keep control of the target language.", items: ["Ask: 「主人公(しゅじんこう)は人(ひと)ですか、動物(どうぶつ)ですか、ロボットですか。」", "Vote on a name and draw a simple symbol for the character.", `State three times: 「${frame(d.one, input.grammar)}。」`] },
        { heading: "Create a problem", items: [`Offer: 「でも、${d.one}がありません。どうして？」`, `Choose a location using ${d.two} or ${d.three}.`, "Accept one student idea, restate it in comprehensible Japanese, and draw it."] },
        { heading: "Circle the story", items: ["Ask yes/no → either/or → who/where questions.", "Add one surprising detail only after the class understands the core situation.", "Pause for a 30-second partner retell before resolving the problem."] },
        { heading: "Resolve and read", items: ["Let students vote on two possible endings.", "Write four short sentences summarising the class story and read them together."] },
      ],
    },
    "story-listening": {
      title: "Story listening",
      preparation: ["Display three key words only.", "Prepare one gesture for the target pattern.", "Tell students they will predict what happens."],
      sections: [
        { heading: "Tell in small pieces", items: [`「けんさんは${sentence(d.one)}。」`, `「でも、${d.one}がありません。」`, `「けんさんは${d.two}に行(い)きます。」`, `「そこに、大(おお)きい${d.three}がいます。」`] },
        { heading: "Pause and check", items: ["After each line, ask one yes/no and one either/or question.", "Students gesture whenever they hear the target pattern.", "Before the final line, offer two possible endings and vote."] },
        { heading: "Retell", items: ["Display four images or keywords.", "Pairs reconstruct the story orally; exact wording is not required."] },
      ],
    },
    "question-ladder": {
      title: "Question ladder",
      preparation: ["Show the target sentence once.", "Plan to stop climbing when understanding becomes uncertain.", prep],
      sections: [
        { heading: "Level 1 · Show understanding", items: [`「${d.one}ですか。」`, `「${d.one}？${d.two}？」`, "Respond by pointing, nodding or choosing A/B."] },
        { heading: "Level 2 · Give one piece", items: [`「${d.one}？${d.two}？」`, `Ask a student: ${question(d.one)}`, "Accept a word or short phrase, then expand it naturally."] },
        { heading: "Level 3 · Build a message", items: [`Complete: 「＿＿＿${input.grammar || "です"}。」`, "Ask a partner the same question.", "Add one detail or reason if ready."] },
      ],
    },
    "true-false": {
      title: "True or false",
      preparation: ["Choose a clear gesture for true and false.", "Mix obvious, personal and playful statements."],
      sections: [
        { heading: "Round 1 · Obvious", items: [`「${d.one}は${d.one}です。」`, `「${d.one}は${d.two}です。」`, "Confirm every response in Japanese."] },
        { heading: "Round 2 · Personal", items: [`「先生(せんせい)は${sentence(d.one)}。」`, `「クラスは${sentence(d.two)}。」`, "Ask one student to correct a false statement."] },
        { heading: "Round 3 · Playful", items: [`「ゴジラは${sentence(d.three)}。」`, "Students write one true or false statement for a partner."] },
      ],
    },
    "read-discuss": {
      title: "Read and discuss",
      preparation: ["Read the text aloud before students see it.", "Reveal one sentence at a time."],
      sections: [
        { heading: "Controlled reading", items: [`ゆきさんは${sentence(d.one)}。`, `けんさんは${sentence(d.two)}。`, `土曜日(どようび)に友達(ともだち)と${d.three}に行(い)きます。`, `そこで、${sentence(d.one)}。`] },
        { heading: "Read for meaning", items: ["Underline the three familiar words.", "Match each sentence to a quick sketch.", "Answer two either/or questions before any translation."] },
        { heading: "Discuss", items: [`「ゆきさんは${sentence(d.one)}か。」`, `Ask a partner: ${question(d.two)}`, "Change one detail to make the text true for you."] },
      ],
    },
    "four-corners": {
      title: "Four corners",
      preparation: [`Label four corners: ${d.words.slice(0, 4).join(" / ") || "A / B / C / D"}.`, "Clear safe movement paths and explain the silent movement signal."],
      sections: [
        { heading: "Choose", items: [`Ask a choice question using: 「${d.words.slice(0,4).join("？")}？」`, "Students move to a corner without speaking.", "Point to each group and state their choice using the target pattern."] },
        { heading: "Talk", items: ["In each corner, students rehearse one shared sentence.", "Ask one representative; then ask the whole class to verify the answer."] },
        { heading: "Change the condition", items: ["Repeat with “don’t like”, “want to try”, or a different character.", "Finish seated with one remembered class fact."] },
      ],
    },
    "lesson-focus": {
      title: "Lesson orientation",
      preparation: ["Keep the message brief and student-friendly.", `Display only the essential target language: ${d.words.slice(0,6).join("、")}.`],
      sections: [
        { heading: "Name the destination", items: [`Tell students: “Today you will understand and use ${d.words.slice(0,6).join("、")}.”`, `Show the target frame: 「${frame("＿＿＿", input.grammar)}。」`, "Connect the language to the activity students will complete later." ] },
        { heading: "Check the direction", items: ["Ask students to point to the word they already recognise.", "Read the target frame once; students listen only.", "Finish with: ‘By the end, you will be able to show or say one complete message.’"] },
      ],
    },
    "listen-draw": {
      title: "Listen and draw",
      preparation: ["Give each student paper or a mini-whiteboard.", "Keep the target word hidden until the reveal.", "Read each prompt twice at a natural, supportive pace."],
      sections: [
        { heading: "Vocabulary rounds", note: "Students listen first and draw meaning; spelling is not required.", items: [`Say twice: 「${d.one}」`, `Say twice: 「${d.two}」`, `Say twice: 「${d.three}」`, "After each drawing, reveal the word with its emoji and let students self-check."] },
        { heading: "Sentence round", items: [`Say: 「${sentence(d.one)}。」`, "Students add one detail to show the whole message.", "Reveal the sentence and ask students to point to the part of their drawing that shows its meaning."] },
        { heading: "Compare and retell", items: ["Partners compare drawings without judging artistic skill.", `One partner points and says: 「${sentence(d.one)}。」`, "Finish by showing all target words and recalling them together."] },
      ],
    },
    "exit-ticket": {
      title: "Exit ticket",
      preparation: ["Choose paper, mini-whiteboard or a digital response.", "Display one achievable success criterion."],
      sections: [
        { heading: "Choose one prompt", items: [`Complete: 「${frame("＿＿＿", input.grammar)}。」`, `Answer: ${question(d.one)}`, `Write one true sentence using ${d.words.slice(0, 3).join("、")}.`] },
        { heading: "Success check", items: ["I communicated a clear meaning.", "I used one target word.", "I attempted the target pattern." ] },
        { heading: "Teacher scan", items: ["Sort responses: ready / nearly there / reteach.", "Begin the next lesson with an anonymous successful example and one short recast."] },
      ],
    },
  };

  const selected = variants[input.activityId] ?? variants["question-ladder"];
  return {
    id,
    activityId: input.activityId,
    targetVocabulary: input.vocabulary,
    targetGrammar: input.grammar,
    ...base,
    time,
    ...selected,
  };
}
