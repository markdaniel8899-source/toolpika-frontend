/**
 * Pure solving logic for Word Scramble and Anagram Solver.
 *
 * Everything runs locally in the browser. No network calls, no storage, no
 * user data leaves the tab. The dictionary is a curated list of common English
 * words between three and twelve letters, with proper nouns excluded.
 */

export const MAX_SCRAMBLE_LETTERS = 20;
export const MIN_WORD_LENGTH = 3;
export const MAX_RESULTS_PER_GROUP = 36;
export const MAX_RESULTS_TOTAL = 120;

export type LengthFilter = "all" | "3" | "4" | "5" | "6+";

export interface LengthGroup {
  length: number;
  words: string[];
}

export interface ScrambleSolution {
  /** Normalised, lowercase letters actually used for the solve. */
  letters: string;
  letterCount: number;
  /** Words that reuse every letter exactly, in display order. */
  fullAnagrams: string[];
  groups: LengthGroup[];
  total: number;
  /** True when the cap trimmed at least one match from the result set. */
  truncated: boolean;
}

/** Curated common English words. All lowercase a-z, 3 to 12 letters. */
export const DICTIONARY: readonly string[] = [
  // 3 letters (238)
  "ace", "act", "add", "age", "aid", "aim", "air", "all", "and", "ant", "any", "arc", "are",
  "arm", "art", "ash", "ask", "ate", "axe", "bad", "bag", "bar", "bat", "bay", "bed", "bee",
  "bet", "bid", "big", "bin", "bit", "bow", "box", "boy", "bud", "bug", "bus", "but", "buy",
  "cab", "can", "cap", "car", "cat", "cow", "cry", "cup", "cut", "dam", "day", "den", "dew",
  "die", "dig", "dim", "dip", "dog", "dot", "dry", "ear", "eat", "egg", "ego", "elf", "elm",
  "end", "era", "eye", "fan", "far", "fat", "few", "fig", "fin", "fit", "fix", "fly", "fox",
  "fun", "fur", "gap", "gas", "gem", "get", "gun", "guy", "gym", "had", "ham", "hat", "hay",
  "hen", "her", "hid", "him", "hip", "his", "hit", "hop", "hot", "hug", "hut", "ice", "ink",
  "its", "ivy", "jam", "jar", "jet", "job", "joy", "jug", "key", "kid", "kit", "lab", "lap",
  "law", "lay", "led", "leg", "let", "lid", "lip", "lit", "log", "lot", "low", "mad", "man",
  "map", "mat", "mix", "mud", "mug", "nap", "net", "new", "nod", "not", "now", "nut", "oak",
  "oar", "oat", "odd", "oil", "old", "one", "opt", "our", "out", "owl", "own", "pad", "pan",
  "pat", "paw", "pen", "pet", "pie", "pig", "pin", "pit", "pot", "pub", "pup", "rag", "ram",
  "ran", "rat", "raw", "red", "rib", "rid", "rim", "rip", "rob", "rod", "row", "rub", "rug",
  "run", "sad", "sat", "saw", "sea", "set", "sew", "she", "shy", "sin", "sip", "sir", "sit",
  "sky", "son", "sum", "sun", "tab", "tag", "tan", "tap", "tar", "tea", "ten", "the", "tie",
  "tin", "tip", "toe", "ton", "too", "top", "toy", "try", "tub", "tug", "van", "vat", "vet",
  "via", "vow", "war", "was", "wax", "way", "web", "wet", "who", "why", "win", "wit", "won",
  "yes", "yet", "zip", "zoo",

  // 4 letters (700)
  "able", "acid", "aged", "also", "area", "army", "away", "baby", "back", "bake", "ball",
  "band", "bank", "bare", "barn", "base", "bath", "beam", "bean", "bear", "beat", "bell",
  "belt", "bend", "best", "bike", "bird", "blue", "boat", "body", "boil", "bold", "bolt",
  "book", "boot", "bore", "both", "bowl", "bulk", "burn", "bush", "busy", "cafe", "cake",
  "call", "calm", "camp", "card", "care", "cart", "case", "cash", "cast", "cave", "cell",
  "chat", "chef", "chin", "city", "club", "coal", "coat", "code", "cold", "come", "cook",
  "cool", "copy", "cord", "core", "cork", "corn", "cost", "crew", "crop", "cube", "curl",
  "cute", "dark", "dash", "data", "date", "dawn", "dead", "deal", "dear", "deck", "deed",
  "deep", "desk", "dial", "dice", "diet", "dine", "dirt", "dish", "disk", "dive", "dock",
  "door", "dose", "dove", "down", "drag", "draw", "drew", "drip", "drop", "drum", "dual",
  "duck", "duel", "dull", "dust", "duty", "each", "earn", "east", "easy", "edge", "else",
  "even", "ever", "exit", "face", "fact", "fade", "fair", "fall", "fame", "farm", "fast",
  "fate", "fear", "feed", "feel", "feet", "fell", "felt", "file", "fill", "film", "find",
  "fine", "fire", "firm", "fish", "flag", "flat", "flee", "flew", "flip", "flow", "foam",
  "fold", "folk", "fond", "food", "fool", "foot", "fork", "form", "fort", "foul", "four",
  "free", "frog", "from", "fuel", "full", "fund", "fuse", "gain", "game", "gate", "gave",
  "gear", "gene", "gift", "girl", "give", "glad", "goal", "goat", "goes", "gold", "golf",
  "gone", "good", "gray", "grew", "grey", "grid", "grin", "grow", "gulf", "hair", "half",
  "hall", "halt", "hand", "hang", "hard", "harm", "hate", "have", "head", "heal", "heap",
  "hear", "heat", "heel", "held", "hell", "helm", "help", "herb", "herd", "here", "hero",
  "hide", "high", "hike", "hill", "hint", "hire", "hive", "hold", "hole", "home", "hood",
  "hoof", "hook", "hope", "horn", "hose", "host", "hour", "huge", "hull", "hunt", "hurt",
  "idea", "inch", "into", "iron", "item", "jade", "jail", "jazz", "join", "joke", "jump",
  "junk", "just", "keen", "keep", "kept", "kick", "kill", "kind", "king", "kiss", "kite",
  "knee", "knew", "knit", "knot", "know", "lace", "lack", "lady", "laid", "lake", "lamb",
  "lamp", "land", "lane", "last", "late", "lawn", "lazy", "lead", "leaf", "lean", "leap",
  "left", "lend", "lens", "less", "life", "lift", "like", "limb", "lime", "line", "link",
  "lion", "list", "live", "load", "loan", "lock", "loft", "logo", "lone", "long", "look",
  "lord", "lose", "loss", "lost", "love", "luck", "lump", "lung", "made", "maid", "mail",
  "main", "make", "male", "mall", "malt", "mane", "many", "mark", "mask", "mass", "mast",
  "mate", "math", "maze", "meal", "mean", "meat", "meet", "melt", "mend", "menu", "mesh",
  "mess", "mice", "mild", "mile", "milk", "mill", "mind", "mine", "mint", "miss", "mist",
  "mode", "mold", "mole", "mood", "moon", "more", "moss", "most", "moth", "move", "much",
  "must", "name", "navy", "near", "neat", "neck", "need", "news", "next", "nice", "nine",
  "node", "none", "noon", "nose", "note", "noun", "nude", "numb", "oath", "obey", "okay",
  "once", "only", "onto", "open", "oral", "ours", "oval", "oven", "over", "pace", "pack",
  "page", "paid", "pain", "pair", "pale", "palm", "pane", "pant", "park", "part", "pass",
  "past", "path", "peak", "pear", "peel", "peer", "pest", "pick", "pile", "pill", "pine",
  "pink", "pint", "pipe", "plan", "play", "plot", "plug", "plum", "plus", "poem", "poet",
  "pole", "poll", "pond", "pony", "pool", "poor", "port", "pose", "post", "pour", "pray",
  "prey", "pull", "pump", "pure", "push", "quit", "race", "rack", "raft", "rage", "raid",
  "rail", "rain", "rank", "rare", "rate", "read", "real", "reap", "rear", "reed", "reef",
  "reel", "rely", "rent", "rest", "rice", "rich", "ride", "rift", "ring", "riot", "rise",
  "risk", "road", "roam", "roar", "robe", "rock", "rode", "role", "roll", "roof", "room",
  "root", "rope", "rose", "rude", "ruin", "rule", "rush", "rust", "safe", "said", "sail",
  "sake", "sale", "salt", "sand", "save", "scan", "scar", "seal", "seam", "seat", "seed",
  "seek", "seem", "self", "sell", "send", "sent", "shed", "ship", "shoe", "shop", "shot",
  "show", "shut", "sick", "side", "sigh", "sign", "silk", "sill", "sing", "sink", "site",
  "size", "skin", "skip", "slab", "slam", "slap", "sled", "slid", "slim", "slip", "slot",
  "slow", "snap", "snow", "sock", "soft", "soil", "sold", "sole", "some", "song", "soon",
  "sore", "sort", "soul", "soup", "sour", "span", "spin", "spot", "star", "stay", "stem",
  "step", "stir", "stop", "such", "suit", "sung", "sure", "swam", "swan", "swim", "tail",
  "take", "tale", "talk", "tame", "tank", "tape", "task", "team", "tear", "tell", "tend",
  "tent", "term", "test", "text", "than", "that", "thaw", "them", "then", "they", "thin",
  "this", "thus", "tick", "tide", "tidy", "tile", "till", "tilt", "time", "tiny", "tire",
  "toad", "toil", "told", "toll", "tomb", "tone", "tool", "torn", "toss", "town", "trap",
  "tray", "tree", "trek", "trim", "trip", "true", "tube", "tune", "turf", "turn", "twin",
  "type", "unit", "upon", "urge", "vain", "vase", "vast", "veil", "vein", "verb", "very",
  "vest", "veto", "vice", "view", "vine", "void", "vote", "wade", "wage", "wait", "wake",
  "walk", "wall", "wand", "want", "ward", "warm", "warn", "warp", "wash", "wave", "weak",
  "wear", "week", "weep", "well", "went", "were", "west", "what", "when", "whip", "wide",
  "wife", "wild", "will", "wind", "wine", "wing", "wipe", "wire", "wise", "wish", "with",
  "woke", "wolf", "wood", "wool", "word", "work", "worm", "worn", "wrap", "yard", "yawn",
  "year", "yell", "yoga", "your", "zero", "zone", "zoom",

  // 5 letters (659)
  "about", "above", "actor", "acute", "adapt", "admit", "adopt", "adult", "after", "again",
  "agent", "agree", "ahead", "alarm", "album", "alert", "alien", "alike", "alive", "allow",
  "alone", "along", "alter", "amber", "ample", "angel", "anger", "angle", "angry", "ankle",
  "apart", "apple", "apply", "arena", "argue", "arise", "armor", "aroma", "array", "arrow",
  "aside", "asset", "audio", "audit", "avoid", "awake", "award", "aware", "basic", "basin",
  "beach", "beard", "beast", "begin", "being", "belly", "bench", "berry", "birch", "birth",
  "black", "blade", "blame", "blank", "blast", "blend", "bless", "blind", "block", "bloom",
  "board", "boast", "bonus", "boost", "booth", "bound", "brain", "brake", "brave", "bread",
  "break", "breed", "brick", "bride", "brief", "bring", "broad", "broke", "brown", "brush",
  "build", "built", "bunch", "burst", "cabin", "cable", "camel", "canal", "candy", "canoe",
  "cargo", "carry", "carve", "catch", "cause", "chain", "chair", "chalk", "chant", "chaos",
  "charm", "chart", "chase", "cheap", "check", "cheek", "cheer", "chess", "chest", "chief",
  "child", "chill", "choir", "chose", "chunk", "civic", "civil", "claim", "clash", "class",
  "clean", "clear", "clerk", "click", "cliff", "climb", "clock", "clone", "close", "cloth",
  "cloud", "coach", "coast", "color", "comet", "coral", "count", "court", "cover", "crack",
  "craft", "crane", "crash", "crawl", "crazy", "cream", "creek", "crime", "crisp", "cross",
  "crowd", "crown", "crush", "curve", "cycle", "daily", "dance", "dealt", "death", "decay",
  "delay", "delta", "dense", "depth", "devil", "diary", "digit", "dirty", "doubt", "dough",
  "dozen", "draft", "drama", "dream", "dress", "dried", "drink", "drive", "drove", "eager",
  "eagle", "early", "earth", "eight", "elbow", "elder", "elect", "elite", "empty", "enemy",
  "enjoy", "enter", "entry", "equal", "error", "event", "every", "exact", "exist", "extra",
  "fable", "faith", "false", "fancy", "fault", "favor", "feast", "fence", "ferry", "fetch",
  "fever", "field", "fifth", "fifty", "fight", "final", "first", "flame", "flash", "fleet",
  "flesh", "float", "flock", "flood", "floor", "flour", "fluid", "focus", "force", "forth",
  "forty", "found", "frame", "fresh", "fried", "front", "frost", "fruit", "funny", "giant",
  "given", "glass", "globe", "glory", "glove", "grace", "grade", "grain", "grand", "grant",
  "grass", "grave", "great", "green", "greet", "grief", "gross", "group", "guard", "guess",
  "guest", "guide", "guilt", "habit", "handy", "happy", "heart", "heavy", "hedge", "hello",
  "hence", "hobby", "honey", "honor", "horse", "hotel", "house", "human", "ideal", "image",
  "imply", "index", "inner", "input", "issue", "ivory", "jelly", "jewel", "joint", "judge",
  "juice", "jolly", "known", "label", "labor", "large", "laser", "later", "laugh", "layer",
  "learn", "least", "leave", "legal", "lemon", "level", "light", "limit", "linen", "liver",
  "local", "logic", "loose", "lower", "loyal", "lucky", "lunch", "magic", "major", "maker",
  "mango", "match", "maybe", "mayor", "meant", "medal", "media", "mercy", "merit", "metal",
  "meter", "might", "minor", "minus", "mixed", "model", "moist", "money", "month", "moral",
  "motor", "mount", "mouse", "mouth", "movie", "music", "naked", "nasty", "naval", "never",
  "newly", "night", "ninth", "noble", "noise", "north", "novel", "nurse", "ocean", "offer",
  "often", "olive", "onion", "opera", "orbit", "order", "other", "ought", "outer", "owner",
  "paint", "panel", "paper", "party", "pasta", "patch", "pause", "peace", "peach", "pearl",
  "phase", "phone", "photo", "piano", "piece", "pilot", "pitch", "pizza", "place", "plain",
  "plane", "plant", "plate", "point", "polar", "porch", "power", "press", "price", "pride",
  "prime", "print", "prior", "prize", "proof", "proud", "prove", "pulse", "punch", "pupil",
  "puppy", "purse", "queen", "query", "quest", "queue", "quick", "quiet", "quite", "radio",
  "raise", "range", "rapid", "ratio", "reach", "react", "ready", "realm", "rebel", "refer",
  "relax", "relay", "renew", "reply", "rider", "ridge", "rifle", "right", "rigid", "rinse",
  "risen", "river", "robot", "rough", "round", "route", "royal", "ruler", "rural", "salad",
  "sauce", "scale", "scene", "scent", "scope", "score", "scout", "sense", "serve", "seven",
  "shade", "shake", "shape", "share", "shark", "sharp", "sheep", "sheer", "sheet", "shelf",
  "shell", "shine", "shirt", "shock", "shore", "short", "shout", "sight", "silly", "since",
  "sixth", "skill", "sleep", "slice", "slide", "slope", "small", "smart", "smell", "smile",
  "smoke", "snake", "solar", "solid", "solve", "sound", "south", "space", "spare", "speak",
  "speed", "spell", "spend", "spice", "spike", "spine", "spite", "split", "spoke", "sport",
  "spray", "stack", "staff", "stage", "stair", "stake", "stamp", "stand", "start", "state",
  "steam", "steel", "steep", "steer", "stick", "stiff", "still", "stock", "stone", "stood",
  "stool", "store", "storm", "story", "stove", "strap", "straw", "strip", "stuck", "study",
  "stuff", "style", "sugar", "suite", "sunny", "super", "sweet", "swing", "sword", "table",
  "taken", "taste", "teach", "teeth", "thank", "theft", "their", "theme", "there", "these",
  "thick", "thing", "think", "third", "those", "three", "threw", "throw", "thumb", "tiger",
  "tight", "timer", "tired", "title", "today", "token", "topic", "total", "touch", "tough",
  "tower", "track", "trade", "train", "trait", "treat", "trend", "trial", "tribe", "trick",
  "tried", "trust", "truth", "twice", "under", "union", "unite", "unity", "until", "upper",
  "upset", "urban", "usage", "usual", "valid", "value", "vapor", "vault", "venue", "video",
  "virus", "visit", "vital", "vivid", "vocal", "voice", "waste", "watch", "water", "weird",
  "wheat", "wheel", "where", "which", "while", "white", "whole", "whose", "widen", "width",
  "woman", "women", "world", "worry", "worse", "worst", "worth", "would", "wound", "write",
  "wrong", "wrote", "yield", "young", "youth", "below", "crops", "debts", "equip",
  "inlet", "tiles", "tines",

  // 6 letters (450)
  "height", "wealth", "accept", "access", "across", "action", "active", "advice", "affect",
  "afford", "agency", "agenda", "almost", "always", "amount", "animal", "answer", "anyone",
  "anyway", "appear", "around", "artist", "aspect", "assist", "assume", "attack", "attend",
  "author", "autumn", "avenue", "backup", "bakery", "bamboo", "banner", "barely", "basket",
  "battle", "beauty", "become", "before", "behalf", "behave", "behind", "belief", "belong",
  "better", "beyond", "bishop", "border", "bottle", "bottom", "bounce", "branch", "breath",
  "bridge", "bright", "broken", "bronze", "bucket", "budget", "bureau", "button", "camera",
  "cancel", "candle", "canvas", "canyon", "carbon", "career", "carpet", "carrot", "castle",
  "casual", "cellar", "center", "chance", "change", "charge", "choice", "circle", "clever",
  "client", "coffee", "column", "corner", "cotton", "couple", "course", "cousin", "cradle",
  "create", "credit", "crisis", "custom", "damage", "danger", "decade", "decide", "degree",
  "delete", "demand", "depart", "depend", "desert", "design", "desire", "detail", "detect",
  "device", "dialog", "differ", "dinner", "direct", "divide", "doctor", "dollar", "domain",
  "donate", "double", "dragon", "drawer", "driver", "during", "easily", "editor", "effect",
  "effort", "eighth", "either", "eleven", "emblem", "emerge", "employ", "enable", "energy",
  "engine", "enough", "entire", "entity", "estate", "excess", "excite", "excuse", "expand",
  "expect", "expert", "expire", "export", "expose", "extend", "fabric", "facing", "factor",
  "failed", "fallen", "family", "famous", "farmer", "father", "fellow", "female", "figure",
  "finger", "finish", "flight", "flower", "follow", "forest", "forget", "formal", "former",
  "fossil", "fourth", "friend", "frozen", "future", "gadget", "garage", "garden", "gather",
  "gender", "gentle", "glance", "global", "golden", "ground", "growth", "guitar", "handle",
  "happen", "harbor", "health", "heaven", "hidden", "honest", "hunter", "impact", "import",
  "indoor", "insect", "inside", "insist", "intend", "invent", "invite", "island", "itself",
  "jacket", "jersey", "junior", "kettle", "kitten", "ladder", "laptop", "latter", "launch",
  "leader", "league", "legend", "length", "lesson", "letter", "likely", "linear", "liquid",
  "listen", "little", "lively", "locate", "luxury", "magnet", "mainly", "manage", "manner",
  "manual", "margin", "market", "master", "matter", "medium", "member", "memory", "mental",
  "method", "middle", "minute", "mirror", "modern", "modest", "moment", "monkey", "mother",
  "motion", "motive", "murder", "muscle", "museum", "mutual", "myself", "narrow", "nation",
  "native", "nature", "nearby", "nearly", "neatly", "needle", "normal", "notice", "number",
  "object", "obtain", "office", "online", "origin", "output", "oxygen", "packet", "paddle",
  "palace", "parent", "people", "pepper", "period", "permit", "person", "picnic", "planet",
  "player", "please", "plenty", "pocket", "poetry", "police", "policy", "poster", "potato",
  "powder", "pretty", "prompt", "proper", "public", "purple", "puzzle", "quartz", "rabbit",
  "random", "rather", "reader", "really", "reason", "recall", "recent", "recipe", "record",
  "reduce", "reform", "region", "regret", "relief", "remain", "remove", "repair", "repeat",
  "resist", "resort", "result", "retail", "retain", "retire", "return", "reveal", "review",
  "reward", "rhythm", "ribbon", "riddle", "rocket", "roller", "rotate", "safety", "salmon",
  "sample", "scheme", "school", "screen", "script", "scroll", "search", "season", "second",
  "secret", "sector", "secure", "seldom", "select", "seller", "senior", "sensor", "series",
  "settle", "shadow", "shield", "signal", "silent", "silver", "simple", "single", "sister",
  "slight", "smooth", "social", "softly", "solely", "spoken", "spread", "spring", "square",
  "stable", "statue", "steady", "submit", "sudden", "suffer", "supply", "symbol", "system",
  "talent", "temple", "tenant", "travel", "treaty", "vacant", "valley", "vessel", "victim",
  "agrees", "cattle", "caught", "causes", "chairs", "chiefs", "choose", "chosen", "church",
  "closer", "colors", "comics", "coming", "common", "cooler", "copies", "covers", "critic",
  "debate", "defend", "dreams", "engage", "ensure", "errors", "essays", "events", "exceed",
  "except", "fairly", "fields", "filled", "filter", "forbid", "forces", "formed", "freely",
  "govern", "guests", "guides", "begins", "indeed", "inform", "invest", "lonely", "lovely",
  "option", "orange", "polite", "report", "rescue", "salary", "severe", "speech", "spirit",
  "enlist", "inlets", "tinsel",

  // 7 letters (288)
  "pattern", "strange", "subject", "unusual", "utility", "victory", "village", "virtual",
  "visible", "visitor", "ability", "absence", "accepts", "acclaim", "account", "achieve",
  "acquire", "address", "advance", "advisor", "affairs", "affects", "already", "alright",
  "amazing", "amongst", "animals", "answers", "anybody", "anymore", "appears", "arrange",
  "arrival", "article", "assumed", "athlete", "attempt", "banking", "battles", "because",
  "becomes", "believe", "benefit", "betting", "between", "bicycle", "biggest", "billion",
  "biology", "blanket", "boulder", "bridges", "brother", "budgets", "buttons", "camping",
  "capable", "capital", "captain", "careers", "carrier", "ceiling", "cellars", "central",
  "century", "certain", "chamber", "chapter", "charity", "chicken", "choices", "circuit",
  "circles", "citizen", "clarity", "classic", "clauses", "clearly", "clients", "climate",
  "closely", "clothes", "coaches", "coastal", "collect", "college", "colonel", "combine",
  "comfort", "comment", "company", "compare", "compass", "concept", "concern", "concert",
  "conduct", "confirm", "connect", "consent", "contact", "contain", "contest", "context",
  "control", "convert", "cooking", "correct", "council", "counsel", "counter", "country",
  "courage", "courses", "cousins", "creates", "credits", "cruelty", "current", "curtain",
  "dancers", "dangers", "dealing", "decades", "decimal", "declare", "decline", "default",
  "defence", "defines", "delayed", "deliver", "demands", "density", "departs", "depends",
  "descent", "deserts", "desired", "details", "develop", "devices", "diagram", "dictate",
  "digests", "disease", "display", "distant", "divided", "divides", "dollars", "domains",
  "donated", "drivers", "eastern", "economy", "editors", "effects", "efforts", "elderly",
  "elected", "elegant", "embassy", "emotion", "empties", "enabled", "enchant", "enquire",
  "entries", "equally", "erasing", "exactly", "examine", "example", "excited", "exhibit",
  "exiting", "expense", "explain", "explore", "express", "extract", "factors", "farmers",
  "fashion", "fatigue", "favored", "feature", "feeling", "fiction", "figures", "finally",
  "finance", "finding", "fingers", "flowers", "forever", "formula", "fortune", "forward",
  "funding", "general", "genuine", "gesture", "airport", "ancient", "another", "artists",
  "balance", "balloon", "bandage", "beaches", "breadth", "drawing", "freedom", "improve",
  "include", "initial", "insight", "instant", "instead", "involve", "journal", "journey",
  "justice", "leisure", "library", "limited", "loyalty", "machine", "measure", "mention",
  "monthly", "morning", "mystery", "nervous", "network", "observe", "obvious", "operate",
  "opinion", "package", "partner", "passage", "patient", "picture", "popular", "prepare",
  "present", "primary", "printer", "problem", "process", "produce", "product", "program",
  "project", "promise", "protect", "provide", "purpose", "quality", "quarter", "quickly",
  "quietly", "receive", "reflect", "replace", "request", "require", "reserve", "resolve",
  "respect", "respond", "revenue", "routine", "science", "society", "special", "support",
  "suppose", "surface", "teacher", "trouble", "created", "meeting", "outcome", "regular",

  // 8 letters (109)
  "although", "analysis", "attitude", "audience", "branches", "canceled", "clusters",
  "computer", "consider", "convince", "creative", "decision", "diamonds", "disagree",
  "discount", "drawings", "emeralds", "envision", "everyone", "exchange", "exercise",
  "existing", "fiercely", "function", "generous", "academic", "accurate", "achieves",
  "acquaint", "activity", "addition", "adoption", "advanced", "advisors", "affected",
  "agencies", "agreeing", "ambition", "anything", "anywhere", "appetite", "applause",
  "approach", "argument", "arranged", "arrivals", "articles", "athletic", "attacked",
  "aviation", "backyard", "barbecue", "behaving", "building", "business", "campaign",
  "capacity", "chambers", "designer", "employer", "innocent", "interest", "judgment",
  "kindness", "language", "laughter", "learning", "magazine", "marriage", "material",
  "mountain", "normally", "occasion", "original", "pleasure", "practice", "priority",
  "probably", "progress", "property", "question", "relation", "religion", "remember",
  "response", "strength", "surprise", "birthday", "calendar", "champion", "children",
  "critical", "estimate", "evaluate", "favorite", "festival", "forceful", "graduate",
  "grateful", "hesitate", "homework", "hospital", "identity", "industry", "medicine",
  "midnight", "personal", "contract", "vacation",

  // 9 letters (71)
  "attention", "childhood", "dishonest", "eliminate", "excellent", "admission", "aesthetic",
  "afternoon", "algorithm", "assistant", "interview", "introduce", "knowledge", "newspaper",
  "principle", "represent", "according", "advantage", "agreement", "ambitious", "answering",
  "associate", "beautiful", "beginning", "campaigns", "carefully", "centuries", "challenge",
  "character", "collected", "colleague", "community", "concerned", "confident", "connected",
  "container", "continued", "contracts", "countries", "currently", "decisions", "democracy",
  "different", "education", "effective", "efficient", "elaborate", "emphasize", "encourage",
  "enjoyment", "establish", "everybody", "financial", "frequency", "gradually", "guarantee",
  "happiness", "healthier", "inspiring", "insurance", "invention", "apartment", "candidate",
  "promotion", "recommend", "respected", "situation", "vegetable", "volunteer", "wonderful",
  "demanding",

  // 10 letters (45)
  "associated", "calculator", "laboratory", "leadership", "literature", "management",
  "acquainted", "additional", "appliances", "assistance", "believable", "beneficial",
  "conference", "considered", "consistent", "contribute", "department", "describing",
  "difficulty", "especially", "eventually", "experience", "expression", "importance",
  "impossible", "membership", "acceptance", "appearance", "background", "collection",
  "difference", "everything", "occupation", "population", "protection", "reflection",
  "restaurant", "scientific", "specialist", "strengthen", "technology", "thoughtful",
  "university", "government", "vegetables",

  // 11 letters (27)
  "appropriate", "achievement", "anniversary", "immediately", "independent", "information",
  "opportunity", "advertising", "agriculture", "alternative", "application", "association",
  "cleanliness", "competition", "development", "environment", "observation", "participate",
  "preparation", "significant", "substantial", "temperature", "traditional", "comfortable",
  "convenience", "performance", "possibility",

  // 12 letters (16)
  "distribution", "introduction", "organization", "presentation", "professional",
  "relationship", "satisfaction", "appreciation", "availability", "capabilities",
  "considerable", "conversation", "disadvantage", "particularly", "significance",
  "similarities",
];

/** Strip anything that is not an ASCII letter and lowercase the rest. */
export function normaliseLetters(input: string): string {
  return input.toLowerCase().replace(/[^a-z]/g, "");
}

/** Count how many of each letter the scrambled input contains. */
export function letterCounts(letters: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const letter of normaliseLetters(letters)) {
    counts.set(letter, (counts.get(letter) ?? 0) + 1);
  }
  return counts;
}

/** True when every letter of a word is available in the scrambled multiset. */
export function canBuildWord(word: string, available: Map<string, number>): boolean {
  if (word.length < MIN_WORD_LENGTH || word.length > MAX_SCRAMBLE_LETTERS) return false;
  const used = new Map<string, number>();
  for (const letter of word) {
    const next = (used.get(letter) ?? 0) + 1;
    if (next > (available.get(letter) ?? 0)) return false;
    used.set(letter, next);
  }
  return true;
}

/** True when a word reuses every scrambled letter exactly once. */
export function isFullAnagram(word: string, letters: string): boolean {
  const source = normaliseLetters(letters);
  if (word.length !== source.length) return false;
  const available = letterCounts(source);
  return canBuildWord(word, available);
}

/** Words formable from the letters, full anagrams first, then long to short. */
export function findFormableWords(letters: string, dictionary: readonly string[] = DICTIONARY): string[] {
  const available = letterCounts(letters);
  const matches = dictionary.filter((word) => canBuildWord(word, available));
  matches.sort((a, b) => {
    const aFull = isFullAnagram(a, letters) ? 1 : 0;
    const bFull = isFullAnagram(b, letters) ? 1 : 0;
    if (aFull !== bFull) return bFull - aFull;
    if (a.length !== b.length) return b.length - a.length;
    return a.localeCompare(b);
  });
  return matches;
}

export function matchesFilter(length: number, filter: LengthFilter): boolean {
  switch (filter) {
    case "3":
      return length === 3;
    case "4":
      return length === 4;
    case "5":
      return length === 5;
    case "6+":
      return length >= MIN_WORD_LENGTH + 3;
    default:
      return true;
  }
}

/** Group words by length, longest group first, preserving word order. */
export function groupByLength(words: readonly string[]): LengthGroup[] {
  const buckets = new Map<number, string[]>();
  for (const word of words) {
    const group = buckets.get(word.length) ?? [];
    group.push(word);
    buckets.set(word.length, group);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([length, group]) => ({ length, words: group }));
}

/** Fisher-Yates shuffle. A custom random function makes this deterministic. */
export function shuffleLetters(letters: string, random: () => number = Math.random): string {
  const items = normaliseLetters(letters).slice(0, MAX_SCRAMBLE_LETTERS).split("");
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const swap = items[i];
    items[i] = items[j];
    items[j] = swap;
  }
  return items.join("");
}

/** Solve a scramble, filter by length, and cap results so the UI stays quick. */
export function solveScramble(input: string, filter: LengthFilter = "all"): ScrambleSolution {
  const letters = normaliseLetters(input).slice(0, MAX_SCRAMBLE_LETTERS);
  const empty: ScrambleSolution = {
    letters,
    letterCount: letters.length,
    fullAnagrams: [],
    groups: [],
    total: 0,
    truncated: false,
  };
  if (letters.length < MIN_WORD_LENGTH) return empty;

  const words = findFormableWords(letters).filter((word) => matchesFilter(word.length, filter));
  const allGroups = groupByLength(words);

  const groups: LengthGroup[] = [];
  let total = 0;
  let truncated = false;
  for (const group of allGroups) {
    if (total >= MAX_RESULTS_TOTAL) {
      truncated = true;
      continue;
    }
    const room = MAX_RESULTS_TOTAL - total;
    const take = Math.min(group.words.length, MAX_RESULTS_PER_GROUP, room);
    if (take < group.words.length) truncated = true;
    if (take > 0) groups.push({ length: group.length, words: group.words.slice(0, take) });
    total += take;
  }

  const fullAnagrams = groups
    .flatMap((group) => group.words)
    .filter((word) => isFullAnagram(word, letters));

  return { letters, letterCount: letters.length, fullAnagrams, groups, total, truncated };
}
