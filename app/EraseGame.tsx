"use client";

import {
  ArrowRight,
  BookOpenText,
  Eraser,
  Eye,
  EyeOff,
  MousePointer2,
  Pilcrow,
  RefreshCw,
  RotateCcw,
  Shuffle,
  WholeWord,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { VocabularyGroup } from "./wordPacks";

type Props = {
  packId: string;
  packName: string;
  groups: VocabularyGroup[];
  patterns: string[];
  onClose: () => void;
};

type EraseMode = "random" | "teacher" | "particles" | "verbs" | "reverse";
type ChunkRole = "time" | "person" | "place" | "detail" | "verb";
type ChunkPart = { text:string; particle?:boolean };
type SentenceChunk = { role:ChunkRole; parts:ChunkPart[] };
type EraseSentence = { key:string; needs:string[]; chunks:SentenceChunk[] };

const text = (value:string):ChunkPart => ({text:value});
const particle = (value:string):ChunkPart => ({text:value,particle:true});
const chunk = (role:ChunkRole,...parts:Array<ChunkPart|string>):SentenceChunk => ({
  role,
  parts:parts.map((part)=>typeof part==="string"?text(part):part),
});
const sentence = (key:string,needs:string[],...chunks:SentenceChunk[]):EraseSentence => ({key,needs,chunks});

const kanaOverrides:Record<string,string> = {
  "学校":"がっこう","小学校":"しょうがっこう","中学校":"ちゅうがっこう","高校":"こうこう","大学":"だいがく","すう学":"すうがく","自己紹介":"じこしょうかい",
  "はる（春）":"はる","なつ（夏）":"なつ","あき（秋）":"あき","ふゆ（冬）":"ふゆ","一がつ":"いちがつ","二がつ":"にがつ","三がつ":"さんがつ","にゅう学しき":"にゅうがくしき","水えいたいかい":"すいえいたいかい","しゅう学りょこう":"しゅうがくりょこう",
  "山":"やま","川":"かわ","天気":"てんき","きょ年":"きょねん","手":"て","耳":"みみ","目":"め","先しゅう":"せんしゅう","まい年":"まいとし","おとこの人":"おとこのひと","おんなの人":"おんなのひと",
  "人気があります":"にんきがあります","上げます":"あげます","自然":"しぜん","大好き":"だいすき","好き":"すき","あまり好きじゃない":"あまりすきじゃない",
  "広島":"ひろしま","午後":"ごご","二日間":"ふつかかん","今日":"きょう","午前中":"ごぜんちゅう","明日":"あした","来月":"らいげつ","家族":"かぞく","部屋":"へや","洋室":"ようしつ","平和記念公園":"へいわきねんこうえん","観光客":"かんこうきゃく","経験":"けいけん","歴史":"れきし","平和":"へいわ","晩ご飯":"ばんごはん","地元":"じもと","お好み焼き":"おこのみやき","伝統工芸":"でんとうこうげい","店":"みせ","筆":"ふで","書道":"しょどう","宮島":"みやじま","神社":"じんじゃ","旅行":"りょこう","世界遺産":"せかいいさん","写真":"しゃしん",
};
const kanaWord = (value:string) => (kanaOverrides[value]??value)
  .replace(/^\(お\)/,"お")
  .replace(/^\(あさ\)/,"あさ")
  .replace(/^\(で\)/,"")
  .replace(/\(な\)/g,"")
  .replace(/かみ\(の毛\)/g,"かみのけ");

const eraseSentenceBank:Record<string,EraseSentence[]> = {
  "iitomo2-ch1":[
    sentence("ch1-early",["まい日","はやく","おきます"],chunk("time","まいにち"),chunk("detail","はやく"),chunk("verb","おきます")),
    sentence("ch1-tea",["(お)ちゃ","のみます"],chunk("detail","おちゃ",particle("を")),chunk("verb","のみます")),
    sentence("ch1-home",["学校","うち","かえります"],chunk("place","がっこう",particle("から")),chunk("place","うち",particle("に")),chunk("verb","かえります")),
    sentence("ch1-club",["ぶかつ","おわります"],chunk("detail","ぶかつ",particle("が")),chunk("verb","おわります")),
    sentence("ch1-bath",["ばんごはん","(お)ふろ","はいります"],chunk("time","ばんごはん",particle("の"),"あと"),chunk("place","おふろ",particle("に")),chunk("verb","はいります")),
    sentence("ch1-sleep",["しゅくだい","ねます"],chunk("time","しゅくだい",particle("の"),"あと"),chunk("verb","ねます")),
  ],
  "iitomo2-ch2":[
    sentence("ch2-maths",["すう学","むずかしい"],chunk("detail","すうがく",particle("は")),chunk("detail","むずかしいです")),
    sentence("ch2-music",["おんがく","かもく"],chunk("detail","おんがく",particle("は")),chunk("detail","すきなかもくです")),
    sentence("ch2-clean",["きょう","そうじ","そうじ(を)します"],chunk("time","きょう"),chunk("detail","そうじ",particle("を")),chunk("verb","します")),
    sentence("ch2-pe",["たいいく","にがて(な)"],chunk("detail","たいいく",particle("は")),chunk("detail","にがてです")),
    sentence("ch2-school",["高校","まで"],chunk("place","こうこう",particle("は")),chunk("time","さんじ",particle("まで")),chunk("detail","です")),
    sentence("ch2-history",["れきし","つまらない"],chunk("detail","れきし",particle("は")),chunk("detail","つまらないです")),
  ],
  "iitomo2-ch3":[
    sentence("ch3-trip",["えんそく","バス"],chunk("place","えんそく",particle("に")),chunk("detail","バス",particle("で")),chunk("verb","いきます")),
    sentence("ch3-summer",["なつやすみ","ひこうき"],chunk("time","なつやすみ",particle("に")),chunk("detail","ひこうき",particle("で")),chunk("verb","いきます")),
    sentence("ch3-festival",["ぶんかさい","ミュージカル"],chunk("place","ぶんかさい",particle("で")),chunk("detail","ミュージカル",particle("を")),chunk("verb","みます")),
    sentence("ch3-schooltrip",["しゅう学りょこう","しんかんせん"],chunk("place","しゅうがくりょこう",particle("に")),chunk("detail","しんかんせん",particle("で")),chunk("verb","いきます")),
    sentence("ch3-spring",["はる（春）","にゅう学しき"],chunk("time","はる",particle("に")),chunk("detail","にゅうがくしき",particle("が")),chunk("verb","あります")),
    sentence("ch3-winter",["ふゆやすみ","でんしゃ"],chunk("time","ふゆやすみ",particle("に")),chunk("detail","でんしゃ",particle("で")),chunk("verb","いきます")),
  ],
  "iitomo2-ch4":[
    sentence("ch4-cook",["しゅうまつに","りょうり"],chunk("time","しゅうまつ",particle("に")),chunk("detail","りょうり",particle("を")),chunk("verb","します")),
    sentence("ch4-photo",["うみ","しゃしんをとります"],chunk("place","うみ",particle("で")),chunk("detail","しゃしん",particle("を")),chunk("verb","とります")),
    sentence("ch4-read",["ひまな時に","どくしょ"],chunk("time","ひまなとき",particle("に")),chunk("detail","どくしょ",particle("を")),chunk("verb","します")),
    sentence("ch4-walk",["山","さんぽします"],chunk("place","やま",particle("で")),chunk("verb","さんぽします")),
    sentence("ch4-sing",["あした","へや","うたいます"],chunk("time","あした"),chunk("place","へや",particle("で")),chunk("verb","うたいます")),
    sentence("ch4-beach",["ビーチ","たくさん","しゃしんをとります"],chunk("place","ビーチ",particle("で")),chunk("detail","たくさん"),chunk("detail","しゃしん",particle("を")),chunk("verb","とります")),
    sentence("ch4-love-fishing",["つり","大好き"],chunk("detail","つり",particle("が")),chunk("detail","だいすきです")),
    sentence("ch4-action-film",["アクションえいが","好き"],chunk("detail","アクションえいが",particle("が")),chunk("detail","すきです")),
    sentence("ch4-shopping",["かいもの","あまり好きじゃない"],chunk("detail","かいもの",particle("は")),chunk("detail","あまりすきじゃないです")),
    sentence("ch4-rest",["あした","やすみます"],chunk("time","あした"),chunk("verb","やすみます")),
    sentence("ch4-lunch",["おべんとう","つくります"],chunk("detail","おべんとう",particle("を")),chunk("verb","つくります")),
  ],
  "iitomo2-ch5":[
    sentence("ch5-tall",["キャラクター","せがたかい"],chunk("detail","このキャラクター",particle("は")),chunk("detail","せ",particle("が")),chunk("detail","たかいです")),
    sentence("ch5-hair",["キャラクター","かみ(の毛)","ながい"],chunk("detail","このキャラクター",particle("は")),chunk("detail","かみのけ",particle("が")),chunk("detail","ながいです")),
    sentence("ch5-tail",["キャラクター","しっぽ","みじかい"],chunk("detail","このキャラクター",particle("は")),chunk("detail","しっぽ",particle("が")),chunk("detail","みじかいです")),
    sentence("ch5-strong",["キャラクター","つよい"],chunk("detail","このキャラクター",particle("は")),chunk("detail","つよいです")),
    sentence("ch5-cosplay",["先しゅう","コスプレ","ふく","きます"],chunk("time","せんしゅう"),chunk("detail","コスプレ",particle("の"),"ふく",particle("を")),chunk("verb","きました")),
    sentence("ch5-anime",["まい年","アニメ","コスプレ"],chunk("time","まいとし"),chunk("detail","アニメ",particle("の"),"コスプレ",particle("を")),chunk("verb","します")),
  ],
  "iitomo2-ch6":[
    sentence("ch6-fireworks",["みんなで","はなび"],chunk("person","みんな",particle("で")),chunk("detail","はなび",particle("を")),chunk("verb","みました")),
    sentence("ch6-food",["パーティー","たこやき"],chunk("place","パーティー",particle("で")),chunk("detail","たこやき",particle("を")),chunk("verb","たべました")),
    sentence("ch6-celebrate",["かぞくみんなで","(お)いわいします"],chunk("person","かぞくみんな",particle("で")),chunk("verb","おいわいしました")),
    sentence("ch6-gift",["プレゼント","ギフトカード","もらいます"],chunk("detail","プレゼント",particle("に")),chunk("detail","ギフトカード",particle("を")),chunk("verb","もらいました")),
    sentence("ch6-yukata",["ゆかた","はなび"],chunk("detail","ゆかた",particle("を")),chunk("time","はなび",particle("の"),"よる",particle("に")),chunk("verb","きました")),
    sentence("ch6-karaoke",["みんなで","カラオケ"],chunk("person","みんな",particle("で")),chunk("place","カラオケ",particle("に")),chunk("verb","いきました")),
  ],
  "iitomo2-tourism":[
    sentence("tourism-popular",["ホテル","人気があります"],chunk("place","ホテル",particle("は")),chunk("detail","にんきがあります")),
    sentence("tourism-stress",["しんりんよく","ストレス","へらします"],chunk("detail","しんりんよく",particle("で")),chunk("detail","ストレス",particle("を")),chunk("verb","へらします")),
    sentence("tourism-energy",["ヨガ","エネルギー","上げます"],chunk("detail","ヨガ",particle("で")),chunk("detail","エネルギー",particle("を")),chunk("verb","あげます")),
    sentence("tourism-country",["いなか","ゆっくりする"],chunk("place","いなか",particle("で")),chunk("verb","ゆっくりします")),
    sentence("tourism-nature",["自然","リラックスします"],chunk("place","しぜん",particle("の"),"なか",particle("で")),chunk("verb","リラックスします")),
    sentence("tourism-meditate",["りょかん","にわ","めいそう"],chunk("place","りょかん",particle("の"),"にわ",particle("で")),chunk("verb","めいそうします")),
  ],
};

const derivedSentenceBank:Record<string,EraseSentence[]> = {
  "iitomo2-ch1":[
    ...[["ヨーグルト","ヨーグルト"],["カレーライス","カレーライス"],["(あさ)ごはん","あさごはん"],["(お)べんとう","おべんとう"],["ばんごはん","ばんごはん"],["(お)ひるごはん","おひるごはん"],["きゅうしょく","きゅうしょく"]].map(([need,kana],index)=>
      sentence(`ch1-food-${index}`,[need],chunk("detail",kana,particle("を")),chunk("verb","たべます"))),
    sentence("ch1-homework-home",["うち","しゅくだい"],chunk("place","うち",particle("で")),chunk("detail","しゅくだい",particle("を")),chunk("verb","します")),
    sentence("ch1-club-school",["学校","ぶかつ"],chunk("place","がっこう",particle("で")),chunk("detail","ぶかつ",particle("を")),chunk("verb","します")),
    sentence("ch1-tea-home",["うち","(お)ちゃ","のみます"],chunk("place","うち",particle("で")),chunk("detail","おちゃ",particle("を")),chunk("verb","のみます")),
    sentence("ch1-lunch-canteen",["ばいてん","(お)べんとう"],chunk("place","ばいてん",particle("で")),chunk("detail","おべんとう",particle("を")),chunk("verb","かいます")),
    sentence("ch1-after-club",["ぶかつ","うち","かえります"],chunk("time","ぶかつ",particle("の"),"あと"),chunk("place","うち",particle("に")),chunk("verb","かえります")),
    sentence("ch1-after-homework-tea",["しゅくだい","(お)ちゃ","のみます"],chunk("time","しゅくだい",particle("の"),"あと"),chunk("detail","おちゃ",particle("を")),chunk("verb","のみます")),
    sentence("ch1-daily-bath",["まい日","(お)ふろ","はいります"],chunk("time","まいにち"),chunk("place","おふろ",particle("に")),chunk("verb","はいります")),
    sentence("ch1-early-sleep",["まい日","はやく","ねます"],chunk("time","まいにち"),chunk("detail","はやく"),chunk("verb","ねます")),
    sentence("ch1-morning-shower",["(あさ)ごはん","あびます"],chunk("time","あさごはん",particle("の"),"まえ"),chunk("detail","シャワー",particle("を")),chunk("verb","あびます")),
    sentence("ch1-club-ends",["ぶかつ","おわります"],chunk("detail","ぶかつ",particle("は")),chunk("time","ごじ",particle("に")),chunk("verb","おわります")),
  ],
  "iitomo2-ch2":[
    ...["えいご","こくご","すう学","おんがく","りか","たいいく","ぎじゅつ","かてい","どうとく","れきし","ちり"].flatMap((subject,index)=>[
      sentence(`ch2-hard-${index}`,[subject,"むずかしい"],chunk("detail",kanaWord(subject),particle("は")),chunk("detail","むずかしいです")),
      sentence(`ch2-boring-${index}`,[subject,"つまらない"],chunk("detail",kanaWord(subject),particle("は")),chunk("detail","つまらないです")),
      sentence(`ch2-weak-${index}`,[subject,"にがて(な)"],chunk("detail",kanaWord(subject),particle("は")),chunk("detail","にがてです")),
      sentence(`ch2-favourite-${index}`,[subject,"いちばん好きなかもく"],chunk("detail","いちばんすきなかもく",particle("は")),chunk("detail",kanaWord(subject)),chunk("detail","です")),
    ]),
    sentence("ch2-clean-today",["きょう","そうじ","そうじ(を)します"],chunk("time","きょう"),chunk("place","がっこう",particle("で")),chunk("detail","そうじ",particle("を")),chunk("verb","します")),
    sentence("ch2-lunch-music",["(お)ひるやすみ","おんがく"],chunk("time","おひるやすみ",particle("に")),chunk("detail","おんがく",particle("を")),chunk("verb","ききます")),
    sentence("ch2-introduction",["自己紹介"],chunk("detail","じこしょうかい",particle("を")),chunk("verb","します")),
    sentence("ch2-school-years",["中学校","高校","から","まで"],chunk("place","ちゅうがっこう",particle("から")),chunk("place","こうこう",particle("まで")),chunk("verb","べんきょうします")),
  ],
  "iitomo2-ch3":[
    ...[["えんそく","バス","えんそく","バス"],["えんそく","じてんしゃ","えんそく","じてんしゃ"],["ぶんかさい","でんしゃ","ぶんかさい","でんしゃ"],["ぶんかさい","スクールバス","ぶんかさい","スクールバス"],["しゅう学りょこう","しんかんせん","しゅうがくりょこう","しんかんせん"],["しゅう学りょこう","ひこうき","しゅうがくりょこう","ひこうき"],["水えいたいかい","バス","すいえいたいかい","バス"],["りんぎょうさい","くるま","りんぎょうさい","くるま"]].map(([event,vehicle,eventKana,vehicleKana],index)=>
      sentence(`ch3-travel-${index}`,[event,vehicle],chunk("place",eventKana,particle("に")),chunk("detail",vehicleKana,particle("で")),chunk("verb","いきます"))),
    sentence("ch3-walk-festival",["ぶんかさい","あるいて"],chunk("place","ぶんかさい",particle("に")),chunk("detail","あるいて"),chunk("verb","いきます")),
    sentence("ch3-spring-entrance",["はる（春）","にゅう学しき"],chunk("time","はる",particle("に")),chunk("detail","にゅうがくしき",particle("が")),chunk("verb","あります")),
    sentence("ch3-summer-swim",["なつ（夏）","水えいたいかい"],chunk("time","なつ",particle("に")),chunk("detail","すいえいたいかい",particle("が")),chunk("verb","あります")),
    sentence("ch3-autumn-festival",["あき（秋）","ぶんかさい"],chunk("time","あき",particle("に")),chunk("detail","ぶんかさい",particle("が")),chunk("verb","あります")),
    sentence("ch3-winter-break",["ふゆ（冬）","ふゆやすみ"],chunk("time","ふゆ",particle("に")),chunk("detail","ふゆやすみ",particle("が")),chunk("verb","あります")),
    sentence("ch3-musical-watch",["ぶんかさい","ミュージカル","みてください"],chunk("place","ぶんかさい",particle("で")),chunk("detail","ミュージカル",particle("を")),chunk("verb","みてください")),
    sentence("ch3-play-watch",["えんげき","みてください"],chunk("detail","えんげき",particle("を")),chunk("verb","みてください")),
    sentence("ch3-festival-come",["ぶんかさい","きてください"],chunk("place","ぶんかさい",particle("に")),chunk("verb","きてください")),
  ],
  "iitomo2-ch4":[
    sentence("ch4-cook-morning",["あさ","りょうり"],chunk("time","あさ"),chunk("detail","りょうり",particle("を")),chunk("verb","します")),
    sentence("ch4-read-room",["へや","どくしょ"],chunk("place","へや",particle("で")),chunk("detail","どくしょ",particle("を")),chunk("verb","します")),
    sentence("ch4-fishing-river",["川","つり"],chunk("place","かわ",particle("で")),chunk("detail","つり",particle("を")),chunk("verb","します")),
    sentence("ch4-shopping-tomorrow",["あした","かいもの"],chunk("time","あした"),chunk("detail","かいもの",particle("を")),chunk("verb","します")),
    sentence("ch4-action-watch",["アクションえいが"],chunk("detail","アクションえいが",particle("を")),chunk("verb","みます")),
    sentence("ch4-bento-tomorrow",["あした","おべんとう","つくります"],chunk("time","あした"),chunk("detail","おべんとう",particle("を")),chunk("verb","つくります")),
    sentence("ch4-sing-room",["へや","うたいます"],chunk("place","へや",particle("で")),chunk("verb","うたいます")),
    sentence("ch4-play-sea",["うみ","(で)あそびます"],chunk("place","うみ",particle("で")),chunk("verb","あそびます")),
    sentence("ch4-photo-beach",["ビーチ","しゃしんをとります"],chunk("place","ビーチ",particle("で")),chunk("detail","しゃしん",particle("を")),chunk("verb","とります")),
    sentence("ch4-walk-mountain",["山","さんぽします"],chunk("place","やま",particle("で")),chunk("verb","さんぽします")),
    sentence("ch4-play-river",["川","(で)あそびます"],chunk("place","かわ",particle("で")),chunk("verb","あそびます")),
    sentence("ch4-many-photos",["たくさん","しゃしんをとります"],chunk("detail","たくさん"),chunk("detail","しゃしん",particle("を")),chunk("verb","とります")),
    sentence("ch4-last-year-sea",["きょ年","うみ","(で)あそびます"],chunk("time","きょねん"),chunk("place","うみ",particle("で")),chunk("verb","あそびました")),
    sentence("ch4-weekend-rest",["しゅうまつに","やすみます"],chunk("time","しゅうまつ",particle("に")),chunk("place","うち",particle("で")),chunk("verb","やすみます")),
    ...[["つり","つり"],["かいもの","かいもの"],["りょうり","りょうり"],["どくしょ","どくしょ"],["アクションえいが","アクションえいが"]].flatMap(([need,kana],index)=>[
      sentence(`ch4-like-${index}`,[need,"好き"],chunk("detail",kana,particle("が")),chunk("detail","すきです")),
      sentence(`ch4-love-${index}`,[need,"大好き"],chunk("detail",kana,particle("が")),chunk("detail","だいすきです")),
      sentence(`ch4-dislike-${index}`,[need,"あまり好きじゃない"],chunk("detail",kana,particle("は")),chunk("detail","あまりすきじゃないです")),
    ]),
  ],
  "iitomo2-ch5":[
    sentence("ch5-long-ears",["キャラクター","耳","ながい"],chunk("detail","このキャラクター",particle("は")),chunk("detail","みみ",particle("が")),chunk("detail","ながいです")),
    sentence("ch5-short-legs",["キャラクター","あし","みじかい"],chunk("detail","このキャラクター",particle("は")),chunk("detail","あし",particle("が")),chunk("detail","みじかいです")),
    sentence("ch5-low",["キャラクター","せ","ひくい"],chunk("detail","このキャラクター",particle("は")),chunk("detail","せ",particle("が")),chunk("detail","ひくいです")),
    sentence("ch5-wonderful",["キャラクター","すてき(な)"],chunk("detail","このキャラクター",particle("は")),chunk("detail","すてきです")),
    sentence("ch5-strange",["キャラクター","へん(な)"],chunk("detail","このキャラクター",particle("は")),chunk("detail","へんです")),
    sentence("ch5-many-costumes",["コスプレ","いろいろ(な)"],chunk("detail","いろいろなコスプレ",particle("が")),chunk("verb","できます")),
    sentence("ch5-last-week-clothes",["先しゅう","コスプレ","ふく","きます"],chunk("time","せんしゅう"),chunk("detail","コスプレ",particle("の"),"ふく",particle("を")),chunk("verb","きました")),
    sentence("ch5-annual-cosplay",["まい年","アニメ","コスプレ"],chunk("time","まいとし"),chunk("detail","アニメ",particle("の"),"コスプレ",particle("を")),chunk("verb","します")),
    sentence("ch5-character-face",["キャラクター","かお","すてき(な)"],chunk("detail","このキャラクター",particle("は")),chunk("detail","かお",particle("が")),chunk("detail","すてきです")),
    sentence("ch5-strong-arms",["キャラクター","手","つよい"],chunk("detail","このキャラクター",particle("は")),chunk("detail","て",particle("が")),chunk("detail","つよいです")),
  ],
  "iitomo2-ch6":[
    ...[["わたあめ","わたあめ"],["たこやき","たこやき"],["とうもろこし","とうもろこし"],["やきそば","やきそば"]].map(([need,kana],index)=>
      sentence(`ch6-food-extra-${index}`,[need],chunk("place","おまつり",particle("で")),chunk("detail",kana,particle("を")),chunk("verb","たべました"))),
    ...[["きもの","きもの"],["ゆかた","ゆかた"],["はっぴ","はっぴ"],["おめん","おめん"]].map(([need,kana],index)=>
      sentence(`ch6-wear-${index}`,[need],chunk("place","おまつり",particle("で")),chunk("detail",kana,particle("を")),chunk("verb","きました"))),
    sentence("ch6-fireworks-night",["よる","はなび","みんなで"],chunk("time","よる"),chunk("person","みんな",particle("で")),chunk("detail","はなび",particle("を")),chunk("verb","みました")),
    sentence("ch6-karaoke-family",["カラオケ","かぞくみんなで"],chunk("person","かぞくみんな",particle("で")),chunk("place","カラオケ",particle("に")),chunk("verb","いきました")),
    sentence("ch6-present-man",["おとこの人","プレゼント","もらいます"],chunk("person","おとこのひと",particle("から")),chunk("detail","プレゼント",particle("を")),chunk("verb","もらいました")),
    sentence("ch6-card-woman",["おんなの人","ギフトカード","もらいます"],chunk("person","おんなのひと",particle("から")),chunk("detail","ギフトカード",particle("を")),chunk("verb","もらいました")),
    sentence("ch6-party-fun",["パーティー","たのしかったです"],chunk("detail","パーティー",particle("は")),chunk("detail","たのしかったです")),
    sentence("ch6-food-delicious",["やきそば","おいしかったです"],chunk("detail","やきそば",particle("は")),chunk("detail","おいしかったです")),
  ],
  "iitomo2-tourism":[
    sentence("tourism-ryokan-popular",["りょかん","人気があります"],chunk("place","りょかん",particle("は")),chunk("detail","にんきがあります")),
    sentence("tourism-hotel-garden",["ホテル","にわ","めいそう"],chunk("place","ホテル",particle("の"),"にわ",particle("で")),chunk("verb","めいそうします")),
    sentence("tourism-ryokan-relax",["りょかん","リラックスします"],chunk("place","りょかん",particle("で")),chunk("verb","リラックスします")),
    sentence("tourism-country-slow",["いなか","ゆっくりする"],chunk("place","いなか",particle("で")),chunk("verb","ゆっくりします")),
    sentence("tourism-nature-slow",["自然","ゆっくりする"],chunk("place","しぜん",particle("の"),"なか",particle("で")),chunk("verb","ゆっくりします")),
    sentence("tourism-yoga-health",["ヨガ","けんこう"],chunk("detail","ヨガ",particle("は")),chunk("detail","けんこう",particle("に")),chunk("detail","いいです")),
    sentence("tourism-meditation-stress",["めいそう","ストレス","へらします"],chunk("detail","めいそう",particle("は")),chunk("detail","ストレス",particle("を")),chunk("verb","へらします")),
    sentence("tourism-forest-energy",["しんりんよく","エネルギー","上げます"],chunk("detail","しんりんよく",particle("は")),chunk("detail","エネルギー",particle("を")),chunk("verb","あげます")),
    sentence("tourism-wellness",["ウェルネス","ツーリズム","けんこう"],chunk("detail","ウェルネスツーリズム",particle("は")),chunk("detail","けんこう",particle("に")),chunk("detail","いいです")),
    sentence("tourism-history-war",["せんそう","れきし"],chunk("detail","せんそう",particle("の"),"れきし",particle("を")),chunk("verb","まなびます")),
    sentence("tourism-disaster-history",["さいがい","れきし"],chunk("detail","さいがい",particle("の"),"れきし",particle("を")),chunk("verb","べんきょうします")),
    sentence("tourism-sightsee-nature",["自然","かんこうする"],chunk("place","しぜん",particle("の"),"なか",particle("を")),chunk("verb","かんこうします")),
  ],
  "year11-hiroshima":[
    sentence("hiroshima-arrival",["きのう","午後","家族","広島","着きます"],chunk("time","きのう",particle("の"),"ごご"),chunk("person","かぞく",particle("と")),chunk("place","ひろしま",particle("に")),chunk("verb","つきました")),
    sentence("hiroshima-tour",["広島","二日間","観光します","〜予定です"],chunk("place","ひろしま",particle("で")),chunk("time","ふつかかん"),chunk("detail","かんこうする"),chunk("verb","よていです")),
    sentence("hiroshima-room",["ホテル","部屋","洋室"],chunk("detail","ホテル",particle("の"),"へや",particle("は")),chunk("detail","ようしつ"),chunk("detail","です")),
    sentence("hiroshima-room-clean",["部屋","広い","きれい"],chunk("detail","へや",particle("は")),chunk("detail","ひろくないですが"),chunk("detail","きれいです")),
    sentence("hiroshima-fresh-linen",["ホテル","新しい","タオル","シーツ","〜てくれます"],chunk("place","ホテル",particle("は")),chunk("time","まいにち"),chunk("detail","あたらしいタオル",particle("と"),"シーツ",particle("に")),chunk("verb","してくれます")),
    sentence("hiroshima-park",["今日","午前中","平和記念公園"],chunk("time","きょう",particle("の"),"ごぜんちゅう"),chunk("place","へいわきねんこうえん",particle("に")),chunk("verb","いきました")),
    sentence("hiroshima-crowded",["観光客","多い","こんでいます"],chunk("detail","かんこうきゃく",particle("が")),chunk("detail","おおくて"),chunk("detail","こんでいました")),
    sentence("hiroshima-experience",["経験"],chunk("detail","とてもいいけいけん",particle("に")),chunk("verb","なりました")),
    sentence("hiroshima-guide",["ガイド","親切(な)","広島","歴史","〜について","説明します"],chunk("person","ガイド",particle("は")),chunk("detail","しんせつ",particle("に")),chunk("detail","ひろしま",particle("の"),"れきし",particle("について")),chunk("verb","せつめいしました")),
    sentence("hiroshima-peace",["家族","平和","話します"],chunk("person","かぞく",particle("と")),chunk("detail","へいわ",particle("について")),chunk("detail","たくさん"),chunk("verb","はなしました")),
    sentence("hiroshima-okonomiyaki",["晩ご飯","地元","お好み焼き","食べます","〜つもりです"],chunk("time","ばんごはん",particle("に")),chunk("detail","じもと",particle("の"),"おこのみやき",particle("を")),chunk("detail","たべる"),chunk("verb","つもりです")),
    sentence("hiroshima-brush",["伝統工芸","店","筆","買います","〜たいと思っています"],chunk("place","でんとうこうげい",particle("の"),"みせ",particle("で")),chunk("detail","ふで",particle("を")),chunk("detail","かいたい",particle("と")),chunk("verb","おもっています")),
    sentence("hiroshima-calligraphy",["オーストラリア","帰ります","書道","始めます","〜たら"],chunk("place","オーストラリア",particle("に")),chunk("detail","かえったら"),chunk("detail","しょどう",particle("を")),chunk("verb","はじめるつもりです")),
    sentence("hiroshima-miyajima",["明日","フェリー","乗ります","宮島","神社","〜予定です"],chunk("time","あした",particle("は")),chunk("detail","フェリー",particle("に"),"のって"),chunk("place","みやじま",particle("の"),"じんじゃ",particle("に")),chunk("detail","いく"),chunk("verb","よていです")),
    sentence("hiroshima-heritage",["神社","世界遺産","〜そうです"],chunk("detail","このじんじゃ",particle("は")),chunk("detail","せかいいさん",particle("だ")),chunk("verb","そうです")),
    sentence("hiroshima-photos",["写真","撮ります","〜つもりです"],chunk("detail","しゃしん",particle("を")),chunk("detail","たくさん"),chunk("verb","とるつもりです")),
    sentence("hiroshima-meet",["来月","オーストラリア","会います"],chunk("time","らいげつ"),chunk("place","オーストラリア",particle("で")),chunk("verb","あいましょう")),
  ],
};

const modeDetails:{id:EraseMode;label:string;description:string;icon:typeof Shuffle}[] = [
  {id:"random",label:"Random erase",description:"Gamify chooses a whole chunk",icon:Shuffle},
  {id:"teacher",label:"Teacher chooses",description:"Click any chunk to hide or restore it",icon:MousePointer2},
  {id:"particles",label:"Particles only",description:"Remove は・が・を・に・で and more",icon:Pilcrow},
  {id:"verbs",label:"Verbs only",description:"Hide the action or sentence ending",icon:WholeWord},
  {id:"reverse",label:"Reverse reveal",description:"Begin blank and reveal one chunk at a time",icon:Eye},
];

const fallbackSentence=()=>sentence("fallback",[],chunk("detail","にほんご"),chunk("detail",particle("を")),chunk("verb","よみます"));

function chooseSentence(pool:EraseSentence[],previousKey=""){
  const different=pool.filter((item)=>item.key!==previousKey);
  const choices=different.length?different:pool;
  return choices[Math.floor(Math.random()*choices.length)]??fallbackSentence();
}

function chooseUnusedSentence(pool:EraseSentence[],usedKeys:Set<string>,previousKey=""){
  let choices=pool.filter((item)=>!usedKeys.has(item.key));

  if(!choices.length){
    pool.forEach((item)=>usedKeys.delete(item.key));
    choices=pool;
  }

  const next=chooseSentence(choices,previousKey);
  usedKeys.add(next.key);
  return next;
}

const chunkText = (value:SentenceChunk) => value.parts.map((part)=>part.text).join("");
const sentenceSignature = (value:EraseSentence) => value.chunks.map(chunkText).join("|");
const particleKeys = (value:EraseSentence) => value.chunks.flatMap((sentenceChunk,chunkIndex)=>sentenceChunk.parts.flatMap((part,partIndex)=>part.particle?[`${chunkIndex}-${partIndex}`]:[]));
const verbIndexes = (value:EraseSentence) => value.chunks.flatMap((sentenceChunk,index)=>sentenceChunk.role==="verb"?[index]:[]);

export default function EraseGame({packId,packName,groups,patterns,onClose}:Props){
  const [phase,setPhase]=useState<"setup"|"playing">("setup");
  const [mode,setMode]=useState<EraseMode>("random");
  const [round,setRound]=useState(1);
  const [hiddenChunks,setHiddenChunks]=useState<Set<number>>(()=>new Set());
  const [hiddenParticles,setHiddenParticles]=useState<Set<string>>(()=>new Set());
  const [actions,setActions]=useState(0);
  const vocabulary=useMemo(()=>groups.flatMap((group)=>group.items),[groups]);
  const selected=useMemo(()=>new Set([...vocabulary,...patterns]),[vocabulary,patterns]);
  const fallbackSentences=useMemo<EraseSentence[]>(()=>vocabulary.map((value,index)=>sentence(
    `fallback-${index}-${value}`,[value],chunk("detail","これ",particle("は")),chunk("detail",kanaWord(value)),chunk("detail","です"),
  )),[vocabulary]);
  const sentences=useMemo(()=>{
    const curated=[...(eraseSentenceBank[packId]??[]),...(derivedSentenceBank[packId]??[])]
      .filter((item)=>item.needs.every((need)=>selected.has(need)));
    const source=curated.length?curated:fallbackSentences;
    return Array.from(new Map(source.map((item)=>[sentenceSignature(item),item])).values());
  },[fallbackSentences,packId,selected]);
  const [current,setCurrent]=useState<EraseSentence>(()=>chooseSentence(sentences));
  const usedSentenceKeys=useRef<Set<string>>(new Set());

  const poolForMode=(nextMode:EraseMode)=>{
    if(nextMode==="verbs"){
      const verbSentences=sentences.filter((item)=>verbIndexes(item).length>0);
      return verbSentences.length?verbSentences:sentences;
    }
    if(nextMode==="particles"){
      const particleSentences=sentences.filter((item)=>particleKeys(item).length>0);
      return particleSentences.length?particleSentences:sentences;
    }
    return sentences;
  };

  const resetBoard=(nextMode:EraseMode,nextSentence=current)=>{
    setHiddenChunks(nextMode==="reverse"?new Set(nextSentence.chunks.map((_,index)=>index)):new Set());
    setHiddenParticles(new Set());
    setActions(0);
  };

  const startGame=()=>{
    usedSentenceKeys.current.clear();
    const next=chooseUnusedSentence(poolForMode(mode),usedSentenceKeys.current);
    setCurrent(next);
    setRound(1);
    resetBoard(mode,next);
    setPhase("playing");
  };

  const changeMode=(nextMode:EraseMode)=>{
    const pool=poolForMode(nextMode);
    const needsCompatibleSentence=(nextMode==="verbs"&&verbIndexes(current).length===0)||(nextMode==="particles"&&particleKeys(current).length===0);
    const next=needsCompatibleSentence?chooseUnusedSentence(pool,usedSentenceKeys.current,current.key):current;
    setMode(nextMode);
    setCurrent(next);
    resetBoard(nextMode,next);
  };

  const nextStep=()=>{
    if(mode==="random"){
      const available=current.chunks.map((_,index)=>index).filter((index)=>!hiddenChunks.has(index));
      if(!available.length)return;
      const target=available[Math.floor(Math.random()*available.length)];
      setHiddenChunks((values)=>new Set([...values,target]));
    }
    if(mode==="particles"){
      const available=particleKeys(current).filter((key)=>!hiddenParticles.has(key));
      if(!available.length)return;
      const target=available[Math.floor(Math.random()*available.length)];
      setHiddenParticles((values)=>new Set([...values,target]));
    }
    if(mode==="verbs"){
      const available=verbIndexes(current).filter((index)=>!hiddenChunks.has(index));
      if(!available.length)return;
      const target=available[Math.floor(Math.random()*available.length)];
      setHiddenChunks((values)=>new Set([...values,target]));
    }
    if(mode==="reverse"){
      const available=Array.from(hiddenChunks);
      if(!available.length)return;
      const target=available[Math.floor(Math.random()*available.length)];
      setHiddenChunks((values)=>{const next=new Set(values);next.delete(target);return next;});
    }
    setActions((value)=>value+1);
  };

  const toggleTeacherChunk=(index:number)=>{
    if(mode!=="teacher")return;
    setHiddenChunks((values)=>{
      const next=new Set(values);
      if(next.has(index))next.delete(index);else next.add(index);
      return next;
    });
    setActions((value)=>value+1);
  };

  const newSentence=()=>{
    const next=chooseUnusedSentence(poolForMode(mode),usedSentenceKeys.current,current.key);
    setCurrent(next);
    setRound((value)=>value+1);
    resetBoard(mode,next);
  };

  const relevantTotal=mode==="particles"?particleKeys(current).length:mode==="verbs"?verbIndexes(current).length:current.chunks.length;
  const activeSentencePool=poolForMode(mode);
  const usedSentenceCount=activeSentencePool.filter((item)=>usedSentenceKeys.current.has(item.key)).length;
  const allUniqueSentencesUsed=activeSentencePool.length>0&&usedSentenceCount>=activeSentencePool.length;
  const relevantHidden=mode==="particles"?hiddenParticles.size:mode==="verbs"?verbIndexes(current).filter((index)=>hiddenChunks.has(index)).length:hiddenChunks.size;
  const complete=mode==="reverse"?hiddenChunks.size===0:relevantTotal>0&&relevantHidden>=relevantTotal;
  const progressValue=mode==="reverse"?current.chunks.length-hiddenChunks.size:relevantHidden;
  const progressLabel=mode==="reverse"?`${progressValue}/${current.chunks.length} revealed`:`${progressValue}/${relevantTotal} erased`;
  const actionLabel=mode==="reverse"?(actions===0?"Reveal one":"Reveal another"):mode==="particles"?(actions===0?"Erase a particle":"Erase another particle"):mode==="verbs"?"Erase a verb":actions===0?"Erase one":"Erase another";
  const sentenceCharacterCount=current.chunks.reduce((total,sentenceChunk)=>total+chunkText(sentenceChunk).length,0);
  const sentenceSizeClass=sentenceCharacterCount>22?"is-extra-long":sentenceCharacterCount>16?"is-long":"";

  return <div className="eg-portal" role="dialog" aria-modal="true" aria-label="Erase Game classroom activity">
    <header className="eg-topbar">
      <div className="eg-brand"><span aria-hidden="true"><Eraser size={25}/></span><div><strong>Erase Game</strong><small>{packName} · sentence memory</small></div></div>
      <div className="eg-top-actions">{phase==="playing"&&<button type="button" onClick={()=>setPhase("setup")}><BookOpenText size={17}/><span>Rules</span></button>}<button type="button" className="eg-close" onClick={onClose} aria-label="Close Erase Game"><X size={21}/></button></div>
    </header>

    {phase==="setup"&&<main className="eg-setup-stage"><section className="eg-start-panel" aria-labelledby="eg-title">
      <div className="eg-start-copy"><p>INPUT BY READING · MEMORY BUILDER</p><h1 id="eg-title">Read it. Erase it. Say it from memory!</h1><span>Gamify creates a logical, mostly-kana sentence from the selected Word Pack and breaks it into readable chunks.</span><div className="eg-kana-note"><BookOpenText size={19}/><strong>All-kana display keeps the reading accessible.</strong></div></div>
      <ol className="eg-rules">
        <li><b>1</b><div><strong>Read together</strong><span>Students read the complete sentence aloud as a class.</span></div></li>
        <li><b>2</b><div><strong>Erase one part</strong><span>Press Erase one, or choose a chunk yourself.</span></div></li>
        <li><b>3</b><div><strong>Say the whole sentence</strong><span>Students still reproduce every missing chunk.</span></div></li>
        <li><b>4</b><div><strong>Keep going</strong><span>Continue until students can say it completely from memory.</span></div></li>
      </ol>
      <fieldset className="eg-mode-choice"><legend>Erase mode</legend>{modeDetails.map((option)=>{const Icon=option.icon;return <button type="button" key={option.id} className={mode===option.id?"selected":""} aria-pressed={mode===option.id} onClick={()=>setMode(option.id)}><span><Icon size={18}/></span><div><strong>{option.label}</strong><small>{option.description}</small></div></button>;})}</fieldset>
      <button type="button" className="eg-start" onClick={startGame}><Eraser size={20}/> Start Erase Game <ArrowRight size={20}/></button>
    </section></main>}

    {phase==="playing"&&<main className="eg-game-stage">
      <section className="eg-game-toolbar" aria-label="Round and erase controls">
        <div className="eg-round-meta"><small>READING ROUND</small><strong>Round {round}</strong></div>
        <nav className="eg-mode-bar" aria-label="Erase mode">{modeDetails.map((option)=>{const Icon=option.icon;return <button type="button" key={option.id} className={mode===option.id?"selected":""} aria-pressed={mode===option.id} onClick={()=>changeMode(option.id)}><Icon size={16}/><span>{option.label}</span></button>;})}</nav>
        <div className="eg-round-tools"><span>{progressLabel}</span><button type="button" onClick={()=>resetBoard(mode)}><RotateCcw size={17}/> Reset sentence</button></div>
      </section>

      <section className="eg-board">
        <div className={`eg-sentence-builder ${sentenceSizeClass}`} aria-live="polite">
          {current.chunks.map((sentenceChunk,chunkIndex)=>{
            const isHidden=hiddenChunks.has(chunkIndex);
            const content=isHidden?<span className="eg-blank" aria-label="erased chunk">{"_".repeat(Math.max(4,Math.min(9,chunkText(sentenceChunk).length)))}</span>:<>{sentenceChunk.parts.map((part,partIndex)=>{const key=`${chunkIndex}-${partIndex}`;return part.particle&&hiddenParticles.has(key)?<span className="eg-particle-blank" aria-label="erased particle" key={key}>{"_".repeat(part.text.length)}</span>:<span className={part.particle?"eg-particle":""} key={key}>{part.text}</span>;})}</>;
            return <div className="eg-chunk-wrap" key={`${current.key}-${chunkIndex}`}>{mode==="teacher"?<button type="button" className={`eg-chunk ${isHidden?"hidden":""}`} aria-pressed={isHidden} aria-label={`${isHidden?"Restore":"Erase"} chunk ${chunkIndex+1}`} onClick={()=>toggleTeacherChunk(chunkIndex)}>{content}</button>:<span className={`eg-chunk ${isHidden?"hidden":""}`}>{content}</span>}{chunkIndex<current.chunks.length-1?<i aria-hidden="true"/>:<span className="eg-full-stop" lang="ja">。</span>}</div>;
          })}
        </div>
        <div className="eg-board-heading"><h1>{mode==="reverse"&&actions===0?"Can you rebuild the sentence?":actions===0?"Read the complete sentence together.":complete&&mode!=="reverse"?"Can you say the whole sentence?":"Keep the whole sentence in your memory."}</h1></div>
        {complete&&<div className={`eg-complete-note ${mode==="reverse"?"reverse":""}`}>{mode==="reverse"?<Eye size={20}/>:<EyeOff size={20}/>}<strong>{mode==="reverse"?"The full sentence is back!":"Now say every missing part from memory!"}</strong></div>}
      </section>

      <section className="eg-controls"><div><small>CLASS PROMPT</small><strong>{mode==="teacher"?"Choose the next chunk on the board.":actionLabel}</strong><span>After every change, read the complete sentence again.</span></div>{mode!=="teacher"&&<button type="button" className="eg-main-action" onClick={nextStep} disabled={complete}>{mode==="reverse"?<Eye size={20}/>:<Eraser size={20}/>} {complete?(mode==="reverse"?"Fully revealed":"All erased"):actionLabel}</button>}<button type="button" className="eg-new-sentence" onClick={newSentence} aria-label={allUniqueSentencesUsed?"Start a fresh sentence cycle":"Show a new unused sentence"}><RefreshCw size={19}/><span><small>{allUniqueSentencesUsed?"ALL UNIQUE SENTENCES USED":"START ANOTHER ROUND"}</small>{allUniqueSentencesUsed?"Start fresh cycle":"New sentence"}</span></button></section>
    </main>}
  </div>;
}
