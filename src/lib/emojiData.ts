/** Common emoji for the sticker picker, grouped like the Mac emoji viewer, with search keywords. */
export interface EmojiGroup {
  name: string
  /** Each entry: the emoji, then space-separated search words. */
  items: string[]
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    name: 'Smileys',
    items: [
      '😀 grinning smile happy', '😃 smile happy open mouth', '😄 smile happy laugh', '😁 grin beaming', '😆 laugh squint',
      '😅 sweat smile nervous', '🤣 rofl laughing floor', '😂 joy tears laugh', '🙂 slight smile', '🙃 upside down',
      '😉 wink', '😊 blush smile happy', '😇 angel halo innocent', '🥰 love hearts adore', '😍 heart eyes love',
      '🤩 star struck excited wow', '😘 kiss blow', '😗 kiss', '😚 kiss closed eyes', '😋 yum tasty tongue',
      '😛 tongue', '😜 wink tongue silly', '🤪 zany crazy', '😝 squint tongue', '🤗 hug hugging', '🤭 oops giggle hand mouth',
      '🤫 shush quiet secret', '🤔 thinking hmm', '😐 neutral', '😑 expressionless', '😏 smirk', '😒 unamused',
      '🙄 eye roll', '😬 grimace', '😌 relieved calm', '😔 pensive sad', '😴 sleeping zzz', '😷 mask sick',
      '🤒 sick thermometer', '🥵 hot', '🥶 cold freezing', '🥳 party celebrate', '😎 cool sunglasses', '🤓 nerd glasses',
      '🧐 monocle', '😕 confused', '😟 worried', '😮 surprised open mouth', '😲 astonished', '😳 flushed embarrassed',
      '🥺 pleading puppy eyes', '😢 cry sad tear', '😭 sob crying loud', '😱 scream shocked', '😖 confounded', '😞 disappointed',
      '😤 triumph huff', '😡 angry red mad', '🤬 swearing cursing', '😈 devil smile imp', '💀 skull dead', '👻 ghost',
      '🤡 clown', '👽 alien', '🤖 robot', '💩 poop', '😺 cat smile', '😻 cat heart eyes',
    ],
  },
  {
    name: 'People',
    items: [
      '👶 baby', '👶🏻 baby light skin', '👦 boy', '👧 girl', '🧒 child', '👨 man', '👩 woman', '🧑 person',
      '👴 old man grandpa', '👵 old woman grandma', '🎅🏻 santa claus christmas', '🤶 mrs claus', '🧑‍🎄 mx claus', '👸 princess',
      '🤴 prince', '🦸 superhero', '🧚 fairy', '🧜 mermaid', '🧞 genie', '💃 dancer dance', '🕺 man dancing',
      '🙋 raising hand', '🤷 shrug', '🙆 ok gesture', '🤦 facepalm', '👪 family', '👨‍👩‍👧 family', '💑 couple heart',
      '👍 thumbs up like yes', '👎 thumbs down no', '👌 ok perfect', '✌️ peace victory', '🤞 crossed fingers luck', '🤟 love you gesture',
      '🤘 rock on', '🤙 call me shaka', '👋 wave hello hi bye', '🤚 raised back hand', '🖐️ hand splayed', '✋ raised hand stop',
      '👏 clap applause', '🙌 raised hands hooray', '🫶 heart hands love', '🙏 pray thanks please', '🤝 handshake', '💪 muscle strong',
      '👀 eyes look', '👅 tongue', '👄 mouth lips', '🫰 snap fingers', '🫵 pointing at you', '☝️ point up',
    ],
  },
  {
    name: 'Hearts',
    items: [
      '❤️ red heart love', '🧡 orange heart', '💛 yellow heart', '💚 green heart', '💙 blue heart', '🩵 light blue heart', '💜 purple heart',
      '🤍 white heart', '🖤 black heart', '🤎 brown heart', '🩷 pink heart', '💖 sparkling heart', '💗 growing heart', '💓 beating heart',
      '💕 two hearts', '💞 revolving hearts', '💝 heart ribbon gift', '💘 heart arrow cupid', '💔 broken heart', '❣️ heart exclamation',
      '💌 love letter', '💋 kiss mark lips', '💯 hundred perfect', '💫 dizzy star', '💥 boom collision', '💦 sweat drops water',
    ],
  },
  {
    name: 'Animals & Nature',
    items: [
      '🐶 dog puppy', '🐱 cat kitten', '🐭 mouse', '🐹 hamster', '🐰 rabbit bunny', '🦊 fox', '🐻 bear', '🐼 panda',
      '🐨 koala', '🐯 tiger', '🦁 lion', '🐮 cow', '🐷 pig', '🐸 frog', '🐵 monkey', '🙈 see no evil monkey',
      '🐔 chicken', '🐣 hatching chick baby', '🐥 chick', '🐧 penguin', '🐦 bird', '🦆 duck', '🦉 owl', '🦄 unicorn',
      '🐝 bee', '🦋 butterfly', '🐞 ladybug', '🐢 turtle', '🐙 octopus', '🐠 fish tropical', '🐬 dolphin', '🐳 whale',
      '🦈 shark', '🐘 elephant', '🦒 giraffe', '🐑 sheep', '🐴 horse', '🦕 dinosaur', '🌸 cherry blossom flower', '💐 bouquet flowers',
      '🌹 rose', '🌻 sunflower', '🌷 tulip', '🌼 blossom daisy', '🌿 herb leaf', '🍀 four leaf clover luck', '🌱 seedling', '🌲 evergreen tree',
      '🌴 palm tree', '🌵 cactus', '🍁 maple leaf autumn', '🍄 mushroom', '🌈 rainbow', '☀️ sun sunny', '🌙 crescent moon night', '⭐ star',
      '🌟 glowing star', '✨ sparkles', '⚡ lightning bolt', '☁️ cloud', '❄️ snowflake', '⛄ snowman', '🔥 fire hot', '💧 droplet water',
      '🌊 wave ocean sea', '🌍 earth globe',
    ],
  },
  {
    name: 'Food & Drink',
    items: [
      '🍎 red apple', '🍊 orange tangerine', '🍋 lemon', '🍌 banana', '🍉 watermelon', '🍇 grapes', '🍓 strawberry', '🍒 cherries',
      '🍑 peach', '🥭 mango', '🍍 pineapple', '🥝 kiwi', '🍅 tomato', '🥑 avocado', '🥕 carrot', '🌽 corn',
      '🍞 bread', '🥐 croissant', '🧀 cheese', '🍳 egg cooking', '🥓 bacon', '🍔 burger hamburger', '🍟 fries', '🍕 pizza',
      '🌭 hot dog', '🌮 taco', '🍣 sushi', '🍜 noodles ramen', '🍰 cake slice', '🎂 birthday cake', '🧁 cupcake', '🍩 donut',
      '🍪 cookie', '🍫 chocolate', '🍬 candy', '🍭 lollipop', '🍦 ice cream', '🍼 baby bottle milk', '☕ coffee tea hot', '🍵 green tea',
      '🧋 bubble tea boba', '🥤 cup straw drink', '🍺 beer', '🍷 wine', '🥂 cheers champagne toast', '🍾 champagne bottle',
    ],
  },
  {
    name: 'Activities',
    items: [
      '🎉 party popper tada celebrate', '🎊 confetti ball', '🎈 balloon', '🎁 gift present', '🎀 ribbon bow', '🎄 christmas tree', '🎃 pumpkin halloween', '🎆 fireworks',
      '🎇 sparkler', '🏆 trophy winner', '🥇 gold medal first', '🏅 medal', '👑 crown king queen', '🎵 music note', '🎶 music notes', '🎤 microphone sing',
      '🎧 headphones', '🎸 guitar', '🎹 piano keyboard', '🥁 drum', '🎮 video game controller', '🎯 bullseye target', '🎲 dice', '🧩 puzzle',
      '⚽ soccer football', '🏀 basketball', '🏈 american football', '⚾ baseball', '🎾 tennis', '🏐 volleyball', '🎱 pool 8 ball', '⛳ golf',
      '🎨 art palette paint', '🎬 clapper movie', '📸 camera flash photo', '📷 camera', '📹 video camera', '🎭 theater masks',
    ],
  },
  {
    name: 'Travel & Objects',
    items: [
      '🚗 car', '🚕 taxi', '🚌 bus', '🚲 bicycle bike', '✈️ airplane plane', '🚀 rocket', '🚢 ship', '🏠 house home',
      '🏖️ beach', '🏝️ island', '🗽 statue of liberty', '🗼 tower', '🏰 castle', '⛺ tent camping', '🌅 sunrise', '🌃 night city',
      '📱 phone mobile', '💻 laptop computer', '⌚ watch', '📺 television tv', '💡 light bulb idea', '🔔 bell', '📌 pin', '📍 round pin location',
      '📎 paperclip', '✏️ pencil', '📚 books', '📖 book open', '📝 memo note', '💰 money bag', '💎 gem diamond', '💍 ring',
      '👗 dress', '👕 t-shirt', '👟 sneaker shoe', '👠 high heel', '👒 sun hat', '🎩 top hat', '🧢 cap', '👓 glasses eyeglasses',
      '🕶️ sunglasses', '🎒 backpack', '🧸 teddy bear', '🪄 magic wand', '🔮 crystal ball', '🧿 evil eye nazar', '🪩 disco ball', '🧳 luggage',
    ],
  },
  {
    name: 'Symbols',
    items: [
      '✅ check mark done', '❌ cross mark', '❓ question', '❗ exclamation', '‼️ double exclamation', '⭕ circle', '🔴 red circle', '🟠 orange circle',
      '🟡 yellow circle', '🟢 green circle', '🔵 blue circle', '🟣 purple circle', '⚫ black circle', '⚪ white circle', '🔺 triangle red', '🔶 orange diamond',
      '➕ plus', '➖ minus', '➡️ right arrow', '⬅️ left arrow', '⬆️ up arrow', '⬇️ down arrow', '🔁 repeat', '♻️ recycle',
      '☮️ peace', '☯️ yin yang', '♾️ infinity', '💤 zzz sleep', '🆒 cool', '🆕 new', '🆗 ok', '🔝 top',
      '🆓 free', '🔞 no one under 18', '🚫 prohibited no', '⚠️ warning', '©️ copyright', '™️ trademark',
    ],
  },
]
