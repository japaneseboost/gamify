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
  const [one, two = safeWords[0], three = safeWords[1] ?? safeWords[0], four = safeWords[2] ?? safeWords[0]] = safeWords;
  const target = input.grammar.trim() || "the selected target language";
  return { words: safeWords, one, two, three, four, target };
};
const shared = (input: GeneratorInput) => {
  const d = details(input);
  return {
    subtitle: `Year ${input.yearLevel} · ${input.support} support · ${input.duration} · ${input.participation}`,
    objective: `Students will understand and respond to repeated, meaningful uses of ${d.target}.`,
    differentiation: [
      `Support: let students point, vote or answer with one word before requiring ${frame(d.one, input.grammar)}.`,
      `Core: provide the frame “${frame("＿＿＿", input.grammar)}” and ask students to change one detail.`,
      `Extend: ask for a reason, correction or follow-up using familiar language.`,
    ],
    nextStep: "Recycle the same language in a different mode next lesson so recognition becomes retrieval and production.",
  };
};

export function generateActivity(input: GeneratorInput): GeneratedActivity {
  const d = details(input);
  const base = shared(input);
  const time = input.duration;
  const id = `${input.activityId}-${Date.now()}`;
  const prep = input.energy === "calm" ? "Keep response routines calm and predictable." : "Leave space for quick whole-class movement or voting.";
  const sentence = (word: string) => frame(word, input.grammar);
  const question = (word: string) => `「${sentence(word)}か。」`;
  const choices = d.words.slice(0, 6);

  const variants: Record<string, Omit<GeneratedActivity, "id" | "subtitle" | "objective" | "time" | "differentiation" | "nextStep">> = {
    "read-my-mind": {
      title: "Read My Mind",
      preparation: [`Display 4–6 choices: ${choices.join("、")}.`, "Teacher secretly chooses one item before each round.", prep],
      sections: [
        { heading: "Predict", note: "Students commit to a choice before the reveal.", items: ["Students show a number, point, or write their prediction.", `Teacher says a broad clue using ${d.target}.`, "Students may keep or change their prediction."] },
        { heading: "Narrow the clues", items: [`Repeat familiar language around ${d.one}, ${d.two} and ${d.three}.`, "Give one clue at a time; avoid translating immediately.", "Ask the class to justify which option now seems most likely."] },
        { heading: "Reveal and recycle", items: [`Reveal: 「答(こた)えは ${d.one} です。」`, "Award a point to correct predictions.", "Run 3–5 rapid rounds with a different hidden answer each time."] },
      ],
    },
    "faulty-echo": {
      title: "Faulty Echo",
      preparation: ["Establish: echo only if the sentence is exactly right.", "Use thumbs-down or silence for a faulty echo.", prep],
      sections: [
        { heading: "Model", items: [`Teach the anchor: 「${sentence(d.one)}。」`, "Choral-repeat it twice so the class knows the exact version."] },
        { heading: "Echo or freeze", items: [`Say: 「${sentence(d.one)}。」 — students echo.`, `Change one detail to ${d.two} — students stay silent.`, `Change back to ${d.one} — students echo again.`, `Try a near-miss using ${d.three}.`] },
        { heading: "Student challenge", items: ["Pairs create one accurate and one faulty version.", "Partner identifies the changed word or chunk and repairs it aloud."] },
      ],
    },
    "delayed-dictation": {
      title: "Delayed Dictation",
      preparation: ["Students need paper or mini-whiteboards.", "Choose a 3–8 second memory delay.", "Read each phrase naturally twice."],
      sections: [
        { heading: "Listen", items: [`Read: 「${sentence(d.one)}。」`, "No writing yet; students only listen and rehearse mentally."] },
        { heading: "Hold", note: "The delay is the memory challenge.", items: ["Wait 5 seconds with the screen blank or hands off pens.", "Students silently rehearse the full phrase."] },
        { heading: "Write and reveal", items: ["Students write from memory.", `Reveal: 「${sentence(d.one)}。」`, "Self-correct missing particles, endings or vocabulary; repeat with a slightly longer sentence."] },
      ],
    },
    karuta: {
      title: "Karuta",
      preparation: [`Lay out or display cards for: ${choices.join("、")}.`, "Students keep hands away until the spoken cue.", "Explain the wrong-card penalty before starting."],
      sections: [
        { heading: "Ready", items: ["Give a 3-second countdown.", "Students scan all cards before hearing the cue."] },
        { heading: "Call", items: [`Call one target, e.g. 「${d.one}」 or 「${sentence(d.one)}。」`, "Students race to touch/select the matching card.", "Wrong choice = miss this round or lose one point."] },
        { heading: "Level up", items: ["Round 1: exact word.", "Round 2: sentence containing the word.", "Round 3: meaning or clue instead of the exact target."] },
      ],
    },
    "narrow-listening": {
      title: "Narrow Listening",
      preparation: ["Prepare a simple table with 3–4 details to identify.", "Keep each mini-text highly similar so only a few details change."],
      sections: [
        { heading: "Text A", items: [`Read: 「ゆきさんは${sentence(d.one)}。${d.two}も好(す)きです。」`, "Students record only the changing details."] },
        { heading: "Text B", items: [`Read a parallel text replacing ${d.one} with ${d.three}.`, "Students compare: what stayed the same and what changed?"] },
        { heading: "Detective check", items: [`Ask: 「だれが ${d.one}？」`, `Ask: 「${d.two} は A？B？」`, "Finish with one final text containing two changed details."] },
      ],
    },
    "sentence-chaos": {
      title: "Sentence Chaos",
      preparation: ["Put one familiar sentence into 4–6 movable chunks.", "Keep particles attached to the phrase they belong with at first."],
      sections: [
        { heading: "Rebuild", items: [`Scramble chunks from: 「${sentence(d.one)}。」`, "Pairs decide the most natural order.", "Read the reconstructed sentence aloud together."] },
        { heading: "Add chaos", items: [`Mix in ${d.two} and ${d.three} as distractors.`, "Students justify why a chunk does or does not fit."] },
        { heading: "Create", items: ["Pairs make a new valid sentence by swapping one chunk.", "Another pair reconstructs it without seeing the original order."] },
      ],
    },
    "sentence-maze": {
      title: "Sentence Maze",
      preparation: ["Create a start point, 3–5 branching chunk choices and a finish.", "At least one route must make a complete valid sentence."],
      sections: [
        { heading: "Find the route", items: [`START → 「${d.one}」 → choose a valid next chunk → FINISH.`, `Use ${d.two}, ${d.three} and ${d.four} as plausible distractors.`, "Students trace one grammatically sensible path."] },
        { heading: "Read the path", items: ["Students read their complete sentence aloud.", "Class checks meaning and particle choices."] },
        { heading: "Multiple exits", items: ["Challenge: find a second valid route.", "Pairs design one new branch without breaking the sentence."] },
      ],
    },
    "find-intruder": {
      title: "Find the Intruder",
      preparation: ["Prepare sets of four where three share a clear feature.", "Accept more than one answer when students can justify it."],
      sections: [
        { heading: "Choose", items: [`Set: ${[d.one,d.two,d.three,d.four].join(" / ")}.`, "Students silently choose the odd one out."] },
        { heading: "Justify", items: ["Students explain with a word, category or simple Japanese sentence.", "Invite a second interpretation if possible."] },
        { heading: "Make one", items: ["Pairs create their own four-item set from the Word Pack.", "Another pair identifies and explains the intruder."] },
      ],
    },
    "reading-bingo": {
      title: "Reading Bingo",
      preparation: [`Create a shuffled grid from: ${choices.join("、")}.`, "Call meanings, clues or related sentences rather than simply reading the exact square."],
      sections: [
        { heading: "Round 1 · Meaning to Japanese", items: [`Give a clue for ${d.one}; students find the matching Japanese item.`, "Continue until a row/column is complete."] },
        { heading: "Round 2 · Japanese to meaning", items: [`Read: 「${sentence(d.two)}。」`, "Students locate the matching meaning/card."] },
        { heading: "Bingo check", items: ["A winner must read back every marked square.", "Class verifies each match before the win is confirmed."] },
      ],
    },
    "one-pen-one-dice": {
      title: "One Pen One Dice",
      preparation: ["Pairs need one pen, one shared task sheet and one die.", "Choose the steal number: 6.", "Student A starts writing while B starts rolling."],
      sections: [
        { heading: "Write vs roll", items: [`Writer completes translations/sentences using ${choices.join("、")}.`, "Roller keeps rolling as quickly as practical."] },
        { heading: "Steal the pen", items: ["When the roller gets 6, they call it and take the pen.", "Roles reverse immediately; the new roller starts rolling."] },
        { heading: "Win", items: ["First student to complete the agreed number of accurate answers wins.", "Teacher spot-checks accuracy before confirming the result."] },
      ],
    },
    "pyramid-translation": {
      title: "Pyramid Translation",
      preparation: ["Build 4–5 lines that grow by one familiar chunk each time.", "Students should see how the shorter line survives inside the longer one."],
      sections: [
        { heading: "Level 1", items: [`Translate: 「${d.one}」.`] },
        { heading: "Level 2–3", items: [`Translate: 「${sentence(d.one)}。」`, `Add ${d.two} or another familiar detail and translate again.`] },
        { heading: "Top of the pyramid", items: [`Create the longest sentence using ${d.one}, ${d.two}, ${d.three} and the target pattern.`, "Students compare, self-correct, then read the final line aloud."] },
      ],
    },
    "sentence-race": {
      title: "Sentence Race",
      preparation: ["Give mini-whiteboards or paper.", "Set a 20–40 second timer per prompt."],
      sections: [
        { heading: "Prompt", items: [`Show keywords: ${d.one} / ${d.two} / ${d.three}.`, "Students write one complete sentence before time expires."] },
        { heading: "Reveal", items: [`Show a model such as 「${sentence(d.one)}。」`, "Award accuracy first, speed second."] },
        { heading: "Harder round", items: ["Remove the sentence frame and give English meaning only.", "Bonus point for an additional familiar detail."] },
      ],
    },
    "running-dictation": {
      title: "Running Dictation",
      preparation: ["Place 4–6 short texts around the room.", "Pairs choose one runner and one writer; swap halfway.", "Set safe movement expectations."],
      sections: [
        { heading: "Run and remember", items: [`Station example: 「${sentence(d.one)}。」`, "Runner reads, memorises, returns without writing it down."] },
        { heading: "Dictate", items: ["Runner dictates exactly; writer records what they hear.", "Runner may return to the station as often as needed."] },
        { heading: "Check", items: ["Pairs compare with the source after completing all stations.", "Circle differences and repair together rather than just counting errors."] },
      ],
    },
    "sentence-auction": {
      title: "Sentence Auction",
      preparation: ["Give each team ¥1,000 imaginary money.", "Mix accurate sentences with believable errors."],
      sections: [
        { heading: "Bid", items: [`Sentence 1: 「${sentence(d.one)}。」`, `Sentence 2: a faulty version using ${d.two}.`, "Teams decide correct/incorrect and secretly bid ¥50–¥300."] },
        { heading: "Reveal", items: ["Reveal whether the sentence is acceptable.", "Correct judgement wins the bid; incorrect judgement loses it."] },
        { heading: "Repair bonus", items: ["If incorrect, teams rewrite the sentence for a bonus.", "Highest balance after 6–10 sentences wins."] },
      ],
    },
    "sentence-stealer": {
      title: "Sentence Stealer",
      preparation: [`Display 6–10 sentence options built from: ${choices.join("、")}.`, "Each student secretly selects three sentences.", "Set a 5–8 minute mingle timer."],
      sections: [
        { heading: "Choose secretly", items: [`Students record three choices such as 「${sentence(d.one)}。」 and 「${sentence(d.two)}。」`, "Selections stay hidden."] },
        { heading: "Speak and steal", items: [`Student A says one target sentence to a partner.`, "If Student B has that exact sentence, A steals/marks it.", "Both students move to a new partner and repeat."] },
        { heading: "Finish", items: ["Students count collected/marked sentences when time ends.", "Winner is the student with the most successful steals.", "Quick reflection: which sentence did you repeat most?"] },
      ],
    },
    trapdoor: {
      title: "Trapdoor",
      preparation: ["Build 3–4 sentence-builder branches with 3 choices each.", "Each student secretly chooses one complete route."],
      sections: [
        { heading: "Hide a route", items: [`Example choices include ${d.one}, ${d.two}, ${d.three}.`, "Student A records one complete sentence route without showing B."] },
        { heading: "Guess from the beginning", items: ["Student B says the first choice, then continues branch by branch.", "Correct branch = continue.", "Wrong branch = TRAPDOOR: return to the start and try again."] },
        { heading: "Swap", items: ["Once the complete route is discovered, swap roles.", "Challenge round: add one extra branch or distractor."] },
      ],
    },
    "oral-ping-pong": {
      title: "Oral Ping-Pong",
      preparation: ["Pairs face each other.", "Choose a rally mode: Japanese↔English, question↔answer, or chunk↔sentence."],
      sections: [
        { heading: "Serve", items: [`A says: 「${d.one}」.`, "B immediately gives the paired response/meaning."] },
        { heading: "Rally", items: [`B sends back ${d.two}; A responds.`, "Continue without long pauses for 30–60 seconds.", "If someone gets stuck, restart the rally rather than eliminating them."] },
        { heading: "Level up", items: [`Use full prompts such as ${question(d.one)}`, "Count the longest accurate rally, then switch partners."] },
      ],
    },
    battleships: {
      title: "Battleships",
      preparation: ["Create a 3×3 or 4×4 grid from two sentence-builder dimensions.", "Each student secretly places 3–4 ships."],
      sections: [
        { heading: "Attack", items: [`Choose a row and column to produce a full target sentence/question using ${d.one} and ${d.two}.`, "Partner answers HIT or MISS only after the full utterance is produced."] },
        { heading: "Respond", items: ["HIT: mark the square.", "MISS: cross it out and keep listening to avoid repeated attacks."] },
        { heading: "Win", items: ["First player to locate all opposing ships wins.", "Require complete target-language production for every attack."] },
      ],
    },
    "janken-evolution": {
      title: "Janken Evolution",
      preparation: ["Set an evolution ladder, e.g. Snake → Kangaroo → Monkey → Ninja → Sensei.", "Everyone starts at level 1 and moves like that character."],
      sections: [
        { heading: "Meet and speak", items: [`Students find a partner and complete a target exchange using ${question(d.one)}.`, "Both partners must speak before playing janken."] },
        { heading: "Janken", items: ["Play じゃんけんぽん！", "Winner evolves one level; loser stays at the same level.", "Students move on and find a new partner at the same level when possible."] },
        { heading: "Finish", items: ["Continue until time expires or someone reaches Sensei.", "Finish with a seated recap using one exchange from the game."] },
      ],
    },
    pqa: {
      title: "Personal questions",
      preparation: ["Display the target language where everyone can see it.", `Choose 3–4 familiar class interests connected to: ${d.words.join("、")}.`, prep],
      sections: [
        { heading: "Open with an easy win", note: "Accept gestures or one-word answers first.", items: [`Ask: ${question(d.one)}`, "Students show thumbs up/down.", `Circle the meaning: 「${d.one}？${d.two}？」`] },
        { heading: "Personalise and recycle", items: [`Ask one student: ${question(d.one)}`, `Follow up with: 「${d.one}？${d.two}？」`, "Ask the class to verify the answer, then repeat with two more students."] },
        { heading: "Finish with a class discovery", items: [`Vote between ${d.one} and ${d.two}.`, "State the result in Japanese twice, then partner-retell what was understood."] },
      ],
    },
    "special-person": {
      title: "Special person interview",
      preparation: ["Choose a willing student and seat them where the class can see them.", "Display the core answer frame.", prep],
      sections: [
        { heading: "Interview", items: [`Start: ${question(d.one)}`, `Offer a choice: 「${d.two}？${d.three}？」`, "Ask one natural follow-up."] },
        { heading: "Turn back to the class", items: ["Ask true/false questions about the student.", `Verify: 「Alexさんは${sentence(d.one)}か。」`, "Invite the class to correct one deliberately silly statement."] },
        { heading: "Micro-retell", items: ["Students tell a partner two remembered facts.", "Invite one confident student to retell."] },
      ],
    },
    "co-created-story": {
      title: "Co-created story",
      preparation: ["Draw three boxes: character, desire, problem.", `Keep these words visible: ${d.words.join("、")}.`, "Prepare two plausible choices and one playful choice for each decision."],
      sections: [
        { heading: "Establish the character", items: ["Vote on a character and name.", `State three times: 「${frame(d.one, input.grammar)}。」`] },
        { heading: "Create a problem", items: [`Offer: 「でも、${d.one}がありません。どうして？」`, `Choose a location using ${d.two} or ${d.three}.`, "Accept one student idea and restate it comprehensibly."] },
        { heading: "Circle the story", items: ["Ask yes/no → either/or → who/where questions.", "Pause for a 30-second partner retell."] },
        { heading: "Resolve and read", items: ["Vote on two endings.", "Write four short summary sentences and read them together."] },
      ],
    },
    "story-listening": {
      title: "Story listening",
      preparation: ["Display three key words only.", "Prepare one gesture for the target pattern.", "Tell students they will predict what happens."],
      sections: [
        { heading: "Tell in small pieces", items: [`「けんさんは${sentence(d.one)}。」`, `「でも、${d.one}がありません。」`, `「けんさんは${d.two}に行(い)きます。」`] },
        { heading: "Pause and check", items: ["After each line, ask one yes/no and one either/or question.", "Students gesture whenever they hear the target pattern."] },
        { heading: "Retell", items: ["Display four images or keywords.", "Pairs reconstruct the story orally."] },
      ],
    },
    "question-ladder": {
      title: "Question ladder",
      preparation: ["Show the target sentence once.", "Plan to stop climbing when understanding becomes uncertain.", prep],
      sections: [
        { heading: "Level 1 · Show understanding", items: [`「${d.one}ですか。」`, `「${d.one}？${d.two}？」`, "Respond by pointing, nodding or choosing A/B."] },
        { heading: "Level 2 · Give one piece", items: [`Ask a student: ${question(d.one)}`, "Accept a word or short phrase, then expand it naturally."] },
        { heading: "Level 3 · Build a message", items: [`Complete: 「＿＿＿${input.grammar || "です"}。」`, "Ask a partner the same question."] },
      ],
    },
    "true-false": {
      title: "True or false",
      preparation: ["Choose a clear gesture for true and false.", "Mix obvious, personal and playful statements."],
      sections: [
        { heading: "Round 1 · Obvious", items: [`「${d.one}は${d.one}です。」`, `「${d.one}は${d.two}です。」`] },
        { heading: "Round 2 · Personal", items: [`「先生(せんせい)は${sentence(d.one)}。」`, `「クラスは${sentence(d.two)}。」`, "Ask one student to correct a false statement."] },
        { heading: "Round 3 · Playful", items: [`「ゴジラは${sentence(d.three)}。」`, "Students write one true or false statement for a partner."] },
      ],
    },
    "read-discuss": {
      title: "Read and discuss",
      preparation: ["Read the text aloud before students see it.", "Reveal one sentence at a time."],
      sections: [
        { heading: "Controlled reading", items: [`ゆきさんは${sentence(d.one)}。`, `けんさんは${sentence(d.two)}。`, `そこで、${sentence(d.three)}。`] },
        { heading: "Read for meaning", items: ["Underline familiar words.", "Match each sentence to a quick sketch.", "Answer two either/or questions."] },
        { heading: "Discuss", items: [`「ゆきさんは${sentence(d.one)}か。」`, `Ask a partner: ${question(d.two)}`, "Change one detail to make the text true for you."] },
      ],
    },
    "four-corners": {
      title: "Four corners",
      preparation: [`Label four corners: ${d.words.slice(0, 4).join(" / ") || "A / B / C / D"}.`, "Clear safe movement paths."],
      sections: [
        { heading: "Choose", items: [`Ask a choice question using: 「${d.words.slice(0,4).join("？")}？」`, "Students move to a corner."] },
        { heading: "Talk", items: ["In each corner, students rehearse one shared sentence.", "Ask one representative, then verify as a class."] },
        { heading: "Change the condition", items: ["Repeat with a new preference, context or character.", "Finish seated with one remembered class fact."] },
      ],
    },
    "lesson-focus": {
      title: "Guided reading",
      preparation: ["Keep the message brief and student-friendly.", `Display only: ${d.words.slice(0,6).join("、")}.`],
      sections: [
        { heading: "Read together", items: [`Show the target frame: 「${frame("＿＿＿", input.grammar)}。」`, "Students identify familiar chunks before translating."] },
        { heading: "Check meaning", items: ["Ask students to point to the word they recognise.", "Match one sentence to a visual or English meaning."] },
      ],
    },
    "listen-draw": {
      title: "Listen and draw",
      preparation: ["Give each student paper or a mini-whiteboard.", "Keep the target word hidden until reveal.", "Read each prompt twice."],
      sections: [
        { heading: "Vocabulary rounds", items: [`Say twice: 「${d.one}」`, `Say twice: 「${d.two}」`, `Say twice: 「${d.three}」`] },
        { heading: "Sentence round", items: [`Say: 「${sentence(d.one)}。」`, "Students add one detail to show the whole message."] },
        { heading: "Compare and retell", items: ["Partners compare drawings.", `One partner points and says: 「${sentence(d.one)}。」`] },
      ],
    },
    "exit-ticket": {
      title: "Exit ticket",
      preparation: ["Choose paper, mini-whiteboard or a digital response.", "Display one achievable success criterion."],
      sections: [
        { heading: "Choose one prompt", items: [`Complete: 「${frame("＿＿＿", input.grammar)}。」`, `Answer: ${question(d.one)}`, `Write one true sentence using ${d.words.slice(0, 3).join("、")}.`] },
        { heading: "Success check", items: ["I communicated a clear meaning.", "I used one target word.", "I attempted the target pattern."] },
        { heading: "Teacher scan", items: ["Sort responses: ready / nearly there / reteach."] },
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
