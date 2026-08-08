import type { L } from "./i18n";

/**
 * All webinar copy, authored in Uzbek Latin. Cyrillic is derived at render time
 * (see translit.ts); the `{ latn, cyrl }` form pins a string the rules get wrong.
 * Chapter titles use the Cyrillic spellings the client supplied in Webinar.txt.
 */

export const S = {
  brand: {
    company: "IMARAT Development",
    project: "Sergeli City",
    tagline: "Sifat taklif emas,",
    taglineAccent: "majburiyat!",
    speaker: "Marat Xayrullayevich",
    speakerRole: "IMARAT Development rahbari",
  },

  cover: {
    kicker: "Onlayn webinar",
    date: "9-avgust, 2026",
    title: "Oyogʻimiz ostidagi zamin",
    subtitle: "Zilzila · Escrow · 9 700 $ uylar · Sergeli City",
    hint: "Boshlash uchun →",
  },

  ui: {
    chapter: "Boʻlim",
    of: "/",
    overview: "Umumiy koʻrinish",
    blackout: "Pauza",
    lang: "Alifbo",
    next: "Keyingi",
    prev: "Oldingi",
    slideFailed: "Ushbu slayd yuklanmadi",
    slideFailedHint: "Navigatsiya ishlayapti — davom eting.",
  },

  chapters: {
    c1: { n: 1, title: { latn: "Zilzila", cyrl: "Зилзила" }, lead: "Yer qimirlaganda binoni nima ushlab qoladi?" },
    c2: { n: 2, title: { latn: "Escrow", cyrl: "Эскроу" }, lead: "Pulingiz qayerda turadi va qachon harakatlanadi." },
    // Non-breaking spaces inside the price: at the opener's 116 px the title
    // wraps, and the only acceptable break is after the currency.
    c3: { n: 3, title: { latn: "9 700 $ uylar", cyrl: "9 700 $ уйлар" }, lead: "Bu narx qanday paydo boʻldi?" },
    c4: { n: 4, title: { latn: "VIP Club", cyrl: "VIP Club" }, lead: "Eski mijozlar uchun yopiq klub." },
    c5: { n: 5, title: { latn: "Sergeli City", cyrl: "Сергели Сити" }, lead: "Loyihaning oʻzi — havodan va koʻcha darajasidan." },
    c6: { n: 6, title: { latn: "Aksiya shartlari", cyrl: "Акция шартлари" }, lead: "Faqat bugungi ishtirokchilar uchun." },
  },

  // ── 1 · ZILZILA ────────────────────────────────────────────────────────────
  quake: {
    y1966: {
      kicker: "1966-yil, 26-aprel",
      time: "soat 05:23",
      title: "Toshkent uygʻonmadi — u silkindi",
      body:
        "Epimarkaz shahar markazining ostida edi. Kuch rekord emas edi — "
        + "ammo binolar bardosh berolmadi.",
      statHomes: "xonadon vayron boʻldi",
      statFamilies: "oila boshpanasiz qoldi",
      note: "Bino qulaganda kuch aybdor emas — konstruksiya aybdor.",
    },
    seismic: {
      title: "Biz seysmik hududda yashaymiz",
      body:
        "Oʻzbekiston faol tektonik yoriqlar ustida joylashgan. Bu oʻzgarmaydi — "
        + "oʻzgaradigani biz nima qurishimiz.",
      annotation: "Savol “boʻladimi?” emas. Savol — “qachon?”",
      legendFault: "Tektonik yoriqlar",
      legendCity: "Toshkent",
    },
    panelVsMonolith: {
      title: "Sovet uylari va monolit karkas",
      body:
        "Panelli uy — choklar bilan ulangan plitalar, chok esa eng zaif nuqta. "
        + "Monolit karkas — yaxlit quyilgan skelet.",
      leftLabel: "Panelli uy",
      rightLabel: "Monolit karkas",
      leftPoints: [
        "Beton M200–M300",
        "Armatura A1 / A2 / A3",
        "Yuk chokka tushadi",
        "Chok ajralsa — plita tushadi",
      ] as L[],
      rightPoints: [
        "Beton M400–M500",
        "Armatura A500S",
        "Yuk karkas boʻylab tarqaladi",
        "Qattiqlik diafragmalari",
      ] as L[],
      caption: "Ikkalasi ham bir xil chastotada silkitildi",
    },
    mass: {
      title: "Ortiqcha vazn — binoning koʻrinmas dushmani",
      body: "Zilzila kuchi binoning massasidan tugʻiladi: ogʻir devor — kuchli zarba.",
      brickLabel: "Gʻisht terimi",
      blockLabel: "Gazoblok",
      unit: "kg/m³",
      formula: "F = m · a",
      formulaNote: "Massani kamaytir — kuchni kamaytirasan.",
      result: "Devorlar 2–4 barobar yengil",
    },
    bearing: {
      title: "Yuk koʻtaruvchi devorga tegib boʻlmaydi",
      body:
        "Yuk koʻtaruvchi devor binoni ushlab turadi. "
        + "Uni buzish — skeletdan suyak olib tashlash.",
      pointA: "Yuk koʻtaruvchi devor",
      pointB: "Boʻlim devori",
      warn: "Rejalashtirishni oʻzgartirish — hisob-kitobsiz emas.",
      /** Unit symbol on the plan's dimension lines. */
      unit: { latn: "m", cyrl: "м" },
      removedLabel: "Buzilgan devor",
      loadShift: "Yuk qoʻshni devorlarga oʻtdi",
    },
    rebar: {
      title: "Konditsioner uchun teshilgan kolonna",
      body:
        "Parma armaturaga tegdi — ikki sterjen uzildi. "
        + "Kolonna turibdi, ammo yuk yoʻli oʻzgardi.",
      step1: "Kolonna kesimi",
      step2: "Parma armaturani uzdi",
      step3: "Yuk qoʻshni kolonnaga oʻtdi",
      step4: "Zanjirli qulash",
      note: "Albatta, birgina bunday teshik sabab binoga zarar yetmasligi mumkin. Ammo, yuzlab bunday teshiklar esa binoni qulatishi ham mumkin.",
      /** Callouts on the RebarCollapse diagram. */
      drillLabel: "Parma",
      cutLabel: "Uzilgan sterjenlar",
      colDamaged: "Teshilgan kolonna",
      colNeighbour: "Qoʻshni kolonna",
      loadLabel: "Yuk",
      overloadLabel: "Ortiqcha yuk",
    },
    turkey: {
      title: "Turkiya sabogʻi",
      body:
        "2023-yil 6-fevral, M7.8. Eng ogʻir talafot Antakyaga tushdi. "
        + "Sabab faqat zilzila emas — nazoratsiz qurilish edi.",
      t1999: "1999 — Izmit zilzilasi, qoidalar qattiqlashtirildi",
      t2018: "2018 — amnistiya (korrupsion yoʻllar bilan): tekshirilmagan binolar qonuniylashtirildi",
      t2023: "2023 — M7.8",
      amnestyLabel: "amnistiya bilan qonuniylashtirilgan bino",
      deathsLabel: "qurbon",
      /** Tick and grid captions in the TurkeyTimeline diagram — kept short so
          they fit a 620-wide box beside the footage. */
      amnestyTick: "amnistiya",
      gridUnit: "tekshirilmagan bino",
      seaSandTitle: "Dengiz qumi",
      seaSandBody:
        "Yuvilmagan dengiz qumidagi xloridlar betonga oʻtadi va armaturani ichkaridan yeydi. "
        + "Tashqaridan bino butun koʻrinadi.",
    },
    vibro: {
      title: "Sunʼiy zilzila",
      subtitle: "Vibrodinamik sinov",
      body:
        "Obyektga qoʻzgʻatkich va akselerometrlar oʻrnatiladi — "
        + "bino MSK-64 shkalasi boʻyicha 1-dan 8 ballik zilzilaga bardoshligini isbotlaydi.",
      sensorLabel: "Akselerometr",
      exciterLabel: "Vibratsiya qoʻzgʻatkichi",
      axisTime: "vaqt",
      axisAmp: "tezlanish",
      stamp: "SINOVDAN OʻTDI",
      labTitle: "Oʻz laboratoriyamiz",
      // The three tonnages are the cards below; naming them here made the
      // slide say the same numbers twice.
      labBody: "Har partiya beton gidravlik pressda sinaladi.",
      labPressLabel: "Gidravlik press",
    },
    close: {
      title: "Zilziladan qoʻrqish kerakmi?",
      answer: "Yoʻq. Sifatli uy tanlash kerak.",
      body:
        "Xavfsizlik — bu toʻgʻri hisoblangan karkas, toʻgʻri beton "
        + "va sinovdan oʻtgan konstruksiya.",
    },
  },

  // ── 2 · ESCROW ─────────────────────────────────────────────────────────────
  escrow: {
    what: {
      title: "Escrow oʻzi nima?",
      body:
        "Xaridorning puli quruvchiga emas, bankdagi maxsus hisobga tushadi. "
        + "Quruvchi uni faqat bosqich tasdiqlangach oladi.",
      beforeLabel: "Escrow’gacha",
      afterLabel: "Escrow bilan",
      beforeSteps: [
        "Xaridor → quruvchi",
        "Pul darhol sarflanadi",
        "Qurilish toʻxtasa — kafolat yoʻq",
      ] as L[],
      afterSteps: [
        "Xaridor → escrow hisob",
        "Bank bosqichni tasdiqlaydi",
        "Faqat shundan keyin — quruvchiga",
      ] as L[],
      buyer: "Xaridor",
      bank: "Bank",
      builder: "Quruvchi",
      milestone: "Bosqich tasdigʻi",
    },
    impact: {
      title: "Escrow uy bozorini qanday oʻzgartiradi",
      body:
        "Pulni qurilishga aylantira olmaydigan kompaniya bozorda qololmaydi. "
        + "Xaridorga — kamroq risk, koʻproq shaffoflik.",
      points: [
        { t: "Muzlab qolgan obyektlar kamayadi", d: "Pul bosqichga bogʻlangan." },
        { t: "Narx real qiymatga yaqinlashadi", d: "Sunʼiy arzon takliflar yoʻqoladi." },
        { t: "Kuchli quruvchilar qoladi", d: "Moliyaviy intizom majburiy boʻladi." },
        { t: "Xaridor himoyalanadi", d: "Bank — uchinchi, betaraf tomon." },
        { t: "Quruvchi aniq moliyaviy reja tuzadi", d: "Xaridor kayfiyatiga qarab shartnomani bekor qila olmaydi." },
      ],
    },
  },

  // ── 3 · TAYYOR UYLAR ───────────────────────────────────────────────────────
  ready: {
    debt: {
      title: "9 700 $ lik uylar qayerdan paydo boʻldi?",
      body:
        "Bu chegirma emas. Bu — qarzdorlik bilan ishlashning natijasi.",
      planTitle: "Kelishuvda shunday edi",
      planBody: "Muddatlar shartnomada aniq belgilangan.",
      planBars: [
        { t: "Toʻlov muddati", v: "4 – 4,5 yil" },
        { t: "Qurilish muddati", v: "2 – 2,5 yil" },
        { t: "Oʻz uyida yashab toʻlash", v: "2 – 2,5 yil" },
      ],
      realTitle: "Amalda esa",
      realBody: "Har 100 mijozdan 85 tasi toʻlovni toʻxtatdi.",
      debtLabel: "soʻm qarzdorlik",
      shareLabel: "mijoz toʻlovni amalga oshira olmadi",
      stretchTitle: "Natija",
      stretchBody: "Qurilish muddati choʻzildi.",
      recoverTitle: "Bugun",
      recoverBody: "Hammasi sekinlik bilan rejadagi holatga qaytmoqda.",
    },
    process: {
      title: "Sotib olish tartibi",
      body:
        "Bu xonadonlar shartnomasi bekor qilingan mijozlardan qaytgan "
        + "va qayta sotuvga chiqarilgan.",
      steps: [
        { t: "Xonadon tanlanadi", d: "Qavat va kvadratura boʻyicha." },
        { t: "Hujjat tekshiriladi", d: "Oldingi shartnoma yopilganligi tasdiqlanadi." },
        { t: "Yangi shartnoma", d: "Toʻgʻridan-toʻgʻri IMARAT Development bilan." },
        { t: "Toʻlov", d: "100% yoki muddatli toʻlov varianti." },
        { t: "Kalit", d: "Shartnomada belgilangan tartibda." },
      ],
    },
    studio: {
      title: "21–23 m² studio xonadon",
      body:
        "Toʻliq mustaqil xonadon: oshxona zonasi, sanuzel, balkon. "
        + "Ijara uchun eng likvid format.",
      planLabel: "Planirovka",
      tourLabel: "Xonadon boʻylab yurish",
      areaLabel: "Maydon",
    },
  },

  // ── 4 · VIP CLUB ───────────────────────────────────────────────────────────
  vip: {
    intro: {
      title: "Investorlar VIP klubi",
      body:
        "Xonadon olgan mijozlar uchun yopiq klub. "
        + "Ilk aʼzolarga — eng yaxshi shartlar.",
      badge: "Ilk aʼzolar uchun",
    },
    perks: {
      title: "Klubning afzalliklari",
      items: [
        { t: "VIP Telegram guruh", d: "Yangi loyihalar bozorga chiqishidan oldin." },
        { t: "Eksklyuziv takliflar", d: "Faqat klub aʼzolariga koʻrsatiladigan xonadonlar." },
        { t: "Katta chegirmalar", d: "Ochiq sotuvda boʻlmaydigan shartlar." },
        { t: "Yopiq tadbirlar", d: "Obyektga tashrif, investor uchrashuvlari." },
        { t: "Tezkor qoʻllab-quvvatlash", d: "Alohida menejer, navbatsiz." },
      ],
    },
    condition: {
      title: "Aʼzo boʻlish sharti",
      rule: "1 yil ichida kamida 1 ta 100% toʻlangan shartnoma",
      body: "Bitta xonadon toʻliq toʻlansin — aʼzolik va barcha bonuslar ochiladi.",
    },
    bonuses: {
      title: "Keyingi xarid uchun bonuslar",
      items: [
        { t: "Qoʻshimcha chegirma", d: "Har bir yangi shartnomada." },
        // No "1+" / "2+" at the head of these two: BonusStack pops a gold
        // threshold chip on exactly these plates, numbered from figures.ts.
        // Repeating the qualifier put it on the same row twice.
        { t: "Bepul taʼmir", d: "100% toʻlov uchun." },
        { t: "Bepul jihozlash", d: "100% toʻlov uchun." },
        { t: "Rieltorlik xizmati", d: "Sotish yoki ijaraga berishda." },
        { t: "Trade-in", d: "Eski uyni hisobga topshirish." },
      ],
    },
    fivePlusOne: {
      title: "5+1 aksiyasi",
      body: "5 ta xonadon xarid qilinsa, 6-siga chegirma toʻlov foiziga teng.",
      rule50: "50% toʻlov bilan 5 ta xonadon → 6-siga 50% chegirma",
      rule100: "100% toʻlov bilan 5 ta xonadon → 6-si sovgʻaga",
      dialPaid: "Toʻlov",
      dialDiscount: "Chegirma",
      giftLabel: "Sovgʻa",
    },
  },

  // ── 5 · SERGELI CITY ───────────────────────────────────────────────────────
  city: {
    master: {
      title: "Sergeli City",
      body:
        "Bitta uy emas — butun mahalla. Yopiq hovlilar, piyoda yoʻlaklar, "
        + "avtomobillar yer ostida.",
      caption: "Sifat taklif emas, majburiyat!",
    },
    gate: { title: "Kirish darvozasi", caption: "Loyihaning yuzi" },
    night: { title: "Tungi fasad", caption: "Kechqurun yoritish sxemasi" },
    mahalla: { title: "Mahalla markazi", caption: "Savdo, xizmat va uchrashuv nuqtasi" },
    park: { title: "Bogʻ va maydonchalar", caption: "Har hovlida bolalar maydonchasi" },
    life: {
      title: "Bu yerda qanday yashaladi",
      items: [
        "Uy oldida bolalar maydonchasi",
        "Barbekyu maydoni",
        "Suv boʻyida hiyobon",
        "Maktab va bogʻchalar",
        "Qoʻshnilar bilan yoqimli suhbatlar",
        "Ochiq havoda faol dam olish",
        "Grillda mazali taomlar",
        "Loyihaga ekskursiya",
      ] as L[],
    },
    infra: {
      title: "Atrofdagi infratuzilma",
      // "Uchta" over a four-item list is arithmetic the room can check; the
      // fourth pin is an existing neighbour, not a building site.
      body:
        "Qiymatni bino emas, atrof belgilaydi. Uchta yirik obyekt qurilmoqda, "
        + "toʻrtinchisi — qoʻshni Eco Park.",
      pins: [
        { t: "Yangi Toshkent xalqaro aeroporti", d: "Loyiha yonida" },
        { t: "Yangi metro bekati", d: "Piyoda masofada" },
        // Short enough to hold one line inside the map's 268-px name plate in
        // both alphabets; the long form wrapped and broke on its own hyphen.
        { t: "Yangi magistral yoʻl", d: "Markazga chiqish" },
        { t: "Eco Park", d: "Qoʻshni hudud" },
      ],
    },
    plans: {
      title: "Planirovkalar",
      body: "Studiodan 2 xonalisigacha — beshta format.",
      items: [
        { t: "Studio", d: "21–23 m²" },
        { t: "1 xonali", d: "38,8 m²" },
        { t: "2 xonali", d: "52,7 m²" },
        { t: "2 xonali", d: "58,3 m²" },
        { t: "2 xonali", d: "62,1 m²" },
      ],
    },
    catalog: { title: "Katalog", body: "Toʻliq katalog — Telegram botda." },
  },

  // ── 6 · AKSIYA ─────────────────────────────────────────────────────────────
  offer: {
    intro: {
      title: "Webinar ishtirokchilari uchun",
      subtitle: "Studio uylar · 21–23 m²",
      badge: "Faqat bugun",
    },
    ladder: {
      title: "100% toʻlovda maxsus narxlar",
      floorsLabel: "qavat",
      note: "Narx qavatga bogʻliq. Eng yuqori qavatlar — eng qulay narx.",
      heroNote: "Webinar narxi",
    },
    firstDay: {
      title: "Aksiyaning birinchi kuni",
      body: "100% toʻlov amalga oshirilsa — bepul taʼmir bonus sifatida taqdim etiladi.",
      badge: "Bepul taʼmir",
    },
    installments: {
      title: "Muddatli toʻlov shartlari",
      v1: "1-variant",
      v2: "2-variant",
      downLabel: "Boshlangʻich toʻlov",
      monthlyLabel: "oyiga",
      monthsLabel: "oyga",
      discountLabel: "chegirma",
      totalLabel: "Umumiy narx",
      bonus: "Bonus: bepul taʼmir",
      or: "yoki",
    },
    cta: {
      title: "Keyingi qadam",
      body: "Band qilish, katalog va toʻliq shartlar — Telegram botda.",
      scan: "Skanerlang",
      handleFallback: "@ImaratDevelopmentBot",
    },
    end: {
      title: "Rahmat!",
      body: "Savollaringizni hoziroq bering — javob beramiz.",
      sign: "IMARAT Development",
    },
  },
} as const;
