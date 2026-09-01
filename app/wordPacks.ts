export type VocabularyGroup = {
  id: string;
  label: string;
  items: string[];
};

export type WordPack = {
  id: string;
  seriesId: string;
  name: string;
  vocabulary: string[];
  vocabularyGroups: VocabularyGroup[];
  patterns: string[];
};

export type WordPackSeries = {
  id: string;
  name: string;
  status: "available" | "awaiting-words";
  packCount?: number;
};

export const wordPackSeries: WordPackSeries[] = [
  { id: "iitomo2", name: "iitomo2", status: "available", packCount: 7 },
  { id: "foundation", name: "Foundation", status: "awaiting-words" },
  { id: "year-11", name: "Year 11", status: "awaiting-words" },
  { id: "year-12", name: "Year 12", status: "awaiting-words" },
];

const makePack = (
  id: string,
  seriesId: string,
  name: string,
  vocabularyGroups: VocabularyGroup[],
  patterns: string[],
): WordPack => ({
  id,
  seriesId,
  name,
  vocabularyGroups,
  vocabulary: vocabularyGroups.flatMap((group) => group.items),
  patterns,
});

export const wordPacks: WordPack[] = [
  makePack(
    "iitomo2-ch1",
    "iitomo2",
    "Ch1: いそがしいですか",
    [
      { id:"expressions", label:"Expressions", items:["すみません"] },
      { id:"adverbs-time", label:"Adverbs & time", items:["いま","まい日","はやく"] },
      { id:"verbs", label:"Verbs", items:["あびます","おきます","おわります","かえります","ねます","のみます","はいります"] },
      { id:"nouns", label:"Nouns", items:["(お)ふろ","ぶかつ","しゅくだい","うち","学校","コンビニ","(お)てん","(お)ちゃ","ヨーグルト","カレーライス","(あさ)ごはん","(お)べんとう","ばんごはん","(お)ひるごはん","きゅうしょく"] },
    ],
    ["何時","〜時","〜半","〜分","[person]の一日","わたしたちの一日"],
  ),
  makePack(
    "iitomo2-ch2",
    "iitomo2",
    "Ch2: 学校、がんばろう！",
    [
      { id:"nouns", label:"Nouns", items:["小学校","中学校","高校","大学","(お)ひるやすみ","そうじ","かもく","えいご","こくご","すう学","おんがく","りか","たいいく","ぎじゅつ","かてい","どうとく","れきし","ちり","自己紹介"] },
      { id:"adjectives", label:"Adjectives", items:["つまらない","にがて(な)","むずかしい"] },
      { id:"adverbs-time", label:"Time expressions", items:["きょう"] },
    ],
    ["何年生","[number]年生","[number]時かんめ","何時かんめ","〜じゃないです","から","まで","何時から","何時まで","そうじ(を)します","好きなかもく","にがてなかもく","いちばん好きなかもく","いちばんむずかしいかもく","〜でした","ほんとうですか"],
  ),
  makePack(
    "iitomo2-ch3",
    "iitomo2",
    "Ch3: 学校のたのしいイベント",
    [
      { id:"nouns", label:"Nouns", items:["はる（春）","なつ（夏）","あき（秋）","ふゆ（冬）","一がつ","二がつ","三がつ","にゅう学しき","えんそく","水えいたいかい","やすみ","はるやすみ","なつやすみ","ふゆやすみ","りんぎょうさい","ぶんかさい","しゅう学りょこう","ミュージカル","えんげき","ひこうき","くるま","じてんしゃ","しんかんせん","スクールバス","タクシー","でんしゃ","バス"] },
      { id:"adverbs-time", label:"Adverbs / manner", items:["あるいて"] },
    ],
    ["あるいて行きます","いつ","何月","何曜日","何で","きてください","たべてください","みてください"],
  ),
  makePack(
    "iitomo2-ch4",
    "iitomo2",
    "Ch4: ひまな時に何をしますか",
    [
      { id:"nouns", label:"Nouns", items:["しゅみ","りょうり","どくしょ","つり","かいもの","アクションえいが","おべんとう","へや","うみ","ビーチ","山","川","天気","くもり"] },
      { id:"verbs", label:"Verbs", items:["つくります","ひきます","(で)あそびます","しゃしんをとります","かきます","つかいます","さんぽします","うたいます","やすみます"] },
      { id:"adjectives", label:"Adjectives", items:["大好き","好き"] },
      { id:"expressions", label:"Expressions", items:["あまり好きじゃない"] },
      { id:"adverbs-time", label:"Adverbs & time", items:["あした","あさ","きょ年","たくさん"] },
    ],
    ["[person]にあいます","[vehicle]にのります","うちにいます","[place]にいます","[place]にいてください","といっていない","ひまな時に","しゅうまつに","休みに","いつも","たいてい","よく","時々","あまり〜ません","ぜんぜん〜ません","[verb]ました","[verb]ませんでした","どう","どうでしたか","よかったです","おいしかったです","いいですね"],
  ),
  makePack(
    "iitomo2-ch5",
    "iitomo2",
    "Ch5: どんなキャラクターですか",
    [
      { id:"nouns", label:"Nouns", items:["あし","あたま","かお","かみ(の毛)","くち","しっぽ","せ","手","はな","耳","目","アニメ","キャラクター","コスプレ","ふく","サービス"] },
      { id:"adjectives", label:"Adjectives", items:["ながい","みじかい","たかい","ひくい","つよい","すてき(な)","へん(な)","いろいろ(な)"] },
      { id:"verbs", label:"Verbs", items:["きます","できます"] },
      { id:"adverbs-time", label:"Time expressions", items:["先しゅう","まい年"] },
    ],
    ["どんな","どの","どっち","どちら","どれ","どうして","せがたかい","せがひくい","それに","この","ここ","じょうずに","にんきがあります"],
  ),
  makePack(
    "iitomo2-ch6",
    "iitomo2",
    "Ch6: おまつりとおいわい",
    [
      { id:"nouns", label:"Nouns", items:["おとこの人","おんなの人","パーティー","プレゼント","ギフトカード","カラオケ","よる","わたあめ","たこやき","とうもろこし","やきそば","きもの","ゆかた","はっぴ","おめん","はなび"] },
      { id:"adjectives", label:"Adjectives", items:["めずらしい","つめたい","たいせつ(な)"] },
      { id:"adverbs-time", label:"Adverbs", items:["もっと","また"] },
    ],
    ["みんなで","全員","かぞくみんなで","もらいます","(お)いわいします","おいしかったです","おもしろかったです","たのしかったです","こんでいました","えんそうします","おなかがいっぱい","きをつけてね","げんきですね","あけてもいいですか"],
  ),
  makePack(
    "iitomo2-tourism",
    "iitomo2",
    "Tourism",
    [
      { id:"expressions", label:"Expressions", items:["人気があります"] },
      { id:"nouns", label:"Nouns", items:["ウェルネス","けんこう","ストレス","エネルギー","自然","ヨガ","めいそう","にわ","ホテル","りょかん","せんそう","れきし","しんりんよく","いなか","さいがい","ツーリズム"] },
      { id:"verbs", label:"Verbs", items:["へらします","上げます","リラックスします","ゆっくりする","かんこうする"] },
    ],
    ["[place]は人気があります","[activity]はストレスをへらします","[activity]はエネルギーを上げます"],
  ),
];
