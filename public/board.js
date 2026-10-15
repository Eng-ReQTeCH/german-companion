// Transcribed from courseboards/wk1. Standard spelling/capitalization is normalized.
export const boardColors=['schwarz','weiß','blau','gelb','orange','rot','lila','grün','rosa','grau'];
export const boardNumbers=[24,59,76,21,245];
export const boardAlphabet=[['G','gehen, groß'],['J','jung, Jacke'],['V','Vater'],['Y','Ägypten'],['W','Wagen'],['H','Hallo, Herz'],['Z','zehn'],['R','rot'],['ß','weiß'],['A','Apfel'],['O','rot'],['U','Uhr'],['E','Eltern'],['I','ich'],['Ä','Äpfel'],['Ö','Österreich'],['Ü','fünf']];
export const regularVerbs=[
 {infinitive:'kommen',english:'to come',forms:['komme','kommst','kommt','kommen','kommt','kommen']},
 {infinitive:'wohnen',english:'to live / reside',forms:['wohne','wohnst','wohnt','wohnen','wohnt','wohnen']},
 {infinitive:'arbeiten',english:'to work',forms:['arbeite','arbeitest','arbeitet','arbeiten','arbeitet','arbeiten']},
 {infinitive:'heißen',english:'to be called',forms:['heiße','heißt','heißt','heißen','heißt','heißen']}
];
export const greetings=[
 {title:'Germany · greetings',register:'Formal / neutral',phrases:['Guten Morgen','Guten Tag','Guten Abend']},
 {title:'Germany · greetings',register:'Informal',phrases:['Hallo','Hallöchen','Hi','Hey','Salü (regional)']},
 {title:'Austria · greetings',register:'Formal / neutral',phrases:['Grüß Gott']},
 {title:'Austria · greetings',register:'Informal',phrases:['Servus']},
 {title:'Germany · goodbyes',register:'Formal / neutral',phrases:['Auf Wiedersehen','Auf Wiederhören (on the phone)']},
 {title:'Germany · goodbyes',register:'Informal',phrases:['Tschüss','Tschüssi','Ciao','Bis bald!','Bis später!']},
 {title:'Austria · goodbyes',register:'Formal / neutral',phrases:['Auf Wiederschauen','Auf Wiederhören (on the phone)']},
 {title:'Austria · goodbyes',register:'Informal',phrases:['Servus','Baba']}
];
export const introductionPatterns=[
 {title:'Name',formal:['Wie heißen Sie?','Wie ist Ihr Name?','Wer sind Sie?'],informal:['Wie heißt du?','Wie ist dein Name?','Wer bist du?'],answers:['Ich heiße …','Mein Name ist …','Ich bin …'],meaning:'What is your name? / Who are you? → My name is … / I am …'},
 {title:'Origin · Herkunft',formal:['Woher kommen Sie?'],informal:['Woher kommst du?'],answers:['Ich komme aus Ägypten.','Ich komme aus dem Jemen.','Ich komme aus dem Sudan.'],meaning:'Where are you from? → I come from Egypt / Yemen / Sudan.'},
 {title:'Residence · Wohnort',formal:['Wo wohnen Sie?'],informal:['Wo wohnst du?'],answers:['Ich wohne in Kairo.'],meaning:'Where do you live? → I live in Cairo.'},
 {title:'Age · Alter',formal:['Wie alt sind Sie?'],informal:['Wie alt bist du?'],answers:['Ich bin … Jahre alt.'],meaning:'How old are you? → I am … years old.'}
];
export const boardVocabulary=[
 ['lesen','to read','يقرأ','verb'],['sehen','to see','يرى','verb'],['arbeiten','to work','يعمل','verb'],['hören','to hear / listen','يسمع / يستمع','verb'],['leben','to live','يعيش','verb'],['fragen','to ask','يسأل','verb'],['gehen','to go','يذهب','verb'],
 ['hell','light / bright','فاتح / مضيء','adjective'],['dunkel','dark','داكن / مظلم','adjective'],['hellblau','light blue','أزرق فاتح','adjective'],['dunkelblau','dark blue','أزرق داكن','adjective'],
 ['der Vorname','first name','الاسم الأول','noun'],['der Nachname','surname','اسم العائلة','noun'],['der Familienname','family name','اسم العائلة','noun'],['das Alter','age','العمر','noun'],['das Jahr','year','سنة','noun'],['der Wohnort','place of residence','محل الإقامة','noun'],['die Herkunft','origin','الأصل','noun'],
 ['Guten Tag','good day / hello','مرحبًا / نهارك سعيد','greeting'],['Guten Abend','good evening','مساء الخير','greeting'],['Hallöchen','hello (informal)','أهلًا','greeting'],['Hi','hi','مرحبًا','greeting'],['Hey','hey','أهلًا','greeting'],['Salü','hi (regional)','مرحبًا (إقليمي)','greeting'],['Grüß Gott','hello (Austria / southern Germany)','مرحبًا (النمسا وجنوب ألمانيا)','greeting'],['Servus','hello / goodbye (regional, informal)','مرحبًا / وداعًا (إقليمي)','greeting'],
 ['Auf Wiedersehen','goodbye','إلى اللقاء','expression'],['Auf Wiederhören','goodbye (on the phone)','إلى اللقاء (عبر الهاتف)','expression'],['Auf Wiederschauen','goodbye (regional, Austria)','إلى اللقاء (النمسا)','expression'],['Tschüssi','bye (informal)','وداعًا','expression'],['Ciao','bye / hi (informal)','وداعًا / مرحبًا','expression'],['Bis bald','see you soon','أراك قريبًا','expression'],['Bis später','see you later','أراك لاحقًا','expression'],['Baba','bye (Austria, informal)','وداعًا (النمسا)','expression'],
 ['der Jemen','Yemen','اليمن','other'],['der Sudan','Sudan','السودان','other'],['das Haus','house','منزل','noun'],['das Auto','car','سيارة','noun'],['die Frau','woman','امرأة','noun'],['das Eis','ice / ice cream','ثلج / آيس كريم','noun'],['der Euro','euro','يورو','noun'],['die Bäume','trees','أشجار','noun'],['die Schule','school','مدرسة','noun'],['die Bücher','books','كتب','noun'],['die Straße','street','شارع','noun'],['das Spiel','game','لعبة','noun'],['richtig','correct / right','صحيح','adjective'],['groß','big / tall','كبير / طويل','adjective'],['jung','young','صغير السن','adjective'],['die Jacke','jacket','سترة','noun'],['der Vater','father','أب','noun'],['der Wagen','car / wagon','سيارة / عربة','noun'],['das Herz','heart','قلب','noun'],['der Apfel','apple','تفاحة','noun'],['die Äpfel','apples','تفاح','noun'],['die Uhr','clock / watch','ساعة','noun'],['die Eltern','parents','الوالدان','noun'],['Österreich','Austria','النمسا','other']
];
