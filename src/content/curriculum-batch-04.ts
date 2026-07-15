import type { ChoiceQuestion, CourseLesson } from "./curriculum-v2";

const q = (prompt: string, options: string[], answer: string, explanation: string): ChoiceQuestion => ({ prompt, options, answer, explanation });

export const listeningBatch04: CourseLesson[] = [
  {
    id: "l33", skill: "listening", section: "Part 1", title: "预约牙科检查", level: "基础", minutes: 15,
    focus: "姓名、症状、时间与就诊准备", audioFile: "l33.mp3", speakers: "Dental receptionist + patient",
    text: "Receptionist: Riverside Dental Practice. Patient: I'd like an appointment because a filling has become loose. Receptionist: Can I take your name? Patient: Sora Malik — S O R A, M A L I K. Receptionist: We have Tuesday at nine twenty or Wednesday at three forty. Patient: Tuesday morning, please. Receptionist: Arrive ten minutes early to update your medical form. The examination costs thirty-two pounds, but any treatment will be discussed separately.",
    questions: [
      q("Why does the patient need an appointment?", ["A loose filling", "A broken tooth", "A routine cleaning"], "A loose filling", "患者说 a filling has become loose。"),
      q("How is the patient's family name spelled?", ["M-A-L-I-K", "M-A-L-E-K", "M-E-L-I-K"], "M-A-L-I-K", "姓氏逐字拼为 M A L I K。"),
      q("When is the appointment?", ["Tuesday at 9:20", "Tuesday at 3:40", "Wednesday at 3:40"], "Tuesday at 9:20", "患者选择 Tuesday morning 的 nine twenty。"),
      q("Why should the patient arrive early?", ["To pay for treatment", "To update a medical form", "To have an X-ray"], "To update a medical form", "前台要求提前十分钟更新 medical form。"),
    ],
  },
  {
    id: "l34", skill: "listening", section: "Part 1", title: "登记火车遗失物品", level: "基础", minutes: 15,
    focus: "行程、座位、物品特征与领取安排", audioFile: "l34.mp3", speakers: "Lost-property adviser + passenger",
    text: "Adviser: Rail lost property. Passenger: I left a backpack on the eight oh five train from Hinton to Crewe this morning. I was in coach C, seat twenty-four. Adviser: Please describe it. Passenger: It is dark blue with a grey handle. There is a red notebook and a pair of glasses inside, but no money. Adviser: We may receive it after six this evening. Your report number is L P six one eight. If it is found, collect it from Platform Office two and bring photo identification.",
    questions: [
      q("What time did the passenger's train leave?", ["7:45", "8:05", "8:50"], "8:05", "乘客说是 eight oh five train。"),
      q("Where was the passenger sitting?", ["Coach B, seat 24", "Coach C, seat 14", "Coach C, seat 24"], "Coach C, seat 24", "位置是 coach C, seat twenty-four。"),
      q("What colour is the backpack?", ["Dark blue", "Grey", "Red"], "Dark blue", "背包本体是 dark blue，提手是 grey。"),
      q("What must the passenger bring when collecting it?", ["The train ticket", "Photo identification", "A bank card"], "Photo identification", "领取时必须带 photo identification。"),
    ],
  },
  {
    id: "l35", skill: "listening", section: "Part 2", title: "图书馆临时搬迁说明", level: "进阶", minutes: 16,
    focus: "关闭日期、临时服务、还书与电脑使用", audioFile: "l35.mp3", speakers: "Library manager",
    text: "The Central Library will close from the third to the sixteenth of June while new heating is installed. A temporary desk in West Community Hall will open from ten until four on weekdays. You can collect reserved books there, but the general shelves will not be available. Return books through the box beside the library's rear gate; fines will be paused during the closure. Public computers can be used at North College after showing a library card. Children's story time will move online, while the local history workshop has been postponed until July.",
    questions: [
      q("When will the Central Library reopen?", ["3 June", "16 June", "17 June"], "17 June", "关闭期为 3 日至 16 日，因此 17 日恢复开放。"),
      q("What can users do at West Community Hall?", ["Browse all library shelves", "Collect reserved books", "Use public computers"], "Collect reserved books", "临时服务台只明确提供 reserved books 领取。"),
      q("Where should books be returned?", ["At North College", "Beside the rear gate", "Inside the community hall"], "Beside the rear gate", "还书箱在 library's rear gate 旁。"),
      q("Which event has been postponed?", ["Children's story time", "The local history workshop", "The heating demonstration"], "The local history workshop", "地方历史工作坊推迟到七月。"),
    ],
  },
  {
    id: "l36", skill: "listening", section: "Part 2", title: "办公楼消防演习说明", level: "进阶", minutes: 16,
    focus: "时间、疏散路线、集合点与访客责任", audioFile: "l36.mp3", speakers: "Safety officer",
    text: "Wednesday's fire drill will begin at eleven fifteen and should last about twenty minutes. When the alarm sounds, leave by the nearest safe staircase; do not use the lifts or stop to collect personal belongings. Teams on floors one to three should assemble in Zone C of the rear car park. Staff from higher floors should use Zone D. Fire wardens will check meeting rooms and toilets. Employees hosting visitors must keep them together and report their names to the zone marshal. Nobody may re-enter until the safety officer gives a clear verbal instruction.",
    questions: [
      q("What time will the drill begin?", ["11:00", "11:15", "11:20"], "11:15", "演习从 eleven fifteen 开始。"),
      q("Which route should staff use?", ["The nearest safe staircase", "The main lift", "The front entrance only"], "The nearest safe staircase", "要求从 nearest safe staircase 离开。"),
      q("Where do teams from the second floor assemble?", ["Zone B", "Zone C", "Zone D"], "Zone C", "一至三层人员在后停车场 Zone C 集合。"),
      q("Who is responsible for visitors?", ["The fire wardens", "The employees hosting them", "The car-park marshal"], "The employees hosting them", "接待访客的员工必须让访客保持在一起并报姓名。"),
    ],
  },
  {
    id: "l37", skill: "listening", section: "Part 3", title: "食品包装调查设计", level: "进阶", minutes: 17,
    focus: "研究问题、样本、数据记录与汇报形式", audioFile: "l37.mp3", speakers: "Tutor + two students",
    text: "Tutor: How will you study attitudes to food packaging? Mei: We first planned to ask whether plastic packaging is harmful. Tutor: That may push people towards one answer. Omar: Then we can show three package types and ask which they would choose. Tutor: Better. Survey eighty shoppers, split equally between the morning and afternoon. Mei: I'll record age groups and choices in a spreadsheet. Omar: I'll photograph the packages and calculate price differences. Tutor: Present a bar chart, not a pie chart, and include two limitations in your report due next Friday.",
    questions: [
      q("Why was the first survey question unsuitable?", ["It was too long", "It could lead respondents", "It mentioned no packaging"], "It could lead respondents", "导师认为问题会把受访者推向某个答案。"),
      q("How many shoppers should be surveyed?", ["40", "60", "80"], "80", "样本数明确为 eighty shoppers。"),
      q("What will Mei record?", ["Age groups and choices", "Package photographs", "Price differences"], "Age groups and choices", "Mei 负责记录年龄组和选择。"),
      q("Which visual should the students present?", ["A bar chart", "A line graph", "A pie chart"], "A bar chart", "导师明确要求 bar chart 而非 pie chart。"),
    ],
  },
  {
    id: "l38", skill: "listening", section: "Part 3", title: "社区交通需求调研", level: "进阶", minutes: 17,
    focus: "目标群体、访谈方式、地图证据与截止日", audioFile: "l38.mp3", speakers: "Council officer + two volunteers",
    text: "Officer: We need evidence about transport problems for older residents. Lena: An online questionnaire would be quick. Tariq: But it could exclude people who rarely use the internet. Officer: Exactly. Conduct forty short telephone interviews instead, including residents from all five neighbourhoods. Lena: I'll prepare the contact list and call the western areas. Tariq: I'll cover the other three. Officer: Mark every difficult bus stop on a map and note whether the issue is distance, seating or lighting. Send the interview summary by Monday and the completed map by Wednesday.",
    questions: [
      q("Why was an online questionnaire rejected?", ["It would cost too much", "It might exclude some residents", "It could not cover five areas"], "It might exclude some residents", "部分老年居民很少上网，会被在线问卷排除。"),
      q("How many interviews are required?", ["30", "40", "50"], "40", "负责人要求 forty short telephone interviews。"),
      q("What should be marked on the map?", ["Every resident's home", "Difficult bus stops", "All council offices"], "Difficult bus stops", "地图需标出每个存在困难的 bus stop。"),
      q("When is the completed map due?", ["Monday", "Tuesday", "Wednesday"], "Wednesday", "访谈摘要周一交，完整地图周三交。"),
    ],
  },
  {
    id: "l39", skill: "listening", section: "Part 4", title: "凉屋顶与城市高温", level: "模考", minutes: 18,
    focus: "原理、研究结果、限制与适用建筑", audioFile: "l39.mp3", speakers: "Environmental design lecturer",
    text: "A cool roof uses a pale or specially coated surface to reflect more sunlight than a conventional dark roof. This can reduce indoor temperatures and lower summer demand for air conditioning. In one school study, top-floor classrooms were up to three degrees cooler after the roof changed. The effect was smaller on cloudy days and in rooms on lower floors. Critics note that cool roofs may slightly increase winter heating needs, although this matters less in warm climates. They work best when insulation is also improved and should not replace shade, ventilation or urban trees.",
    questions: [
      q("What does a cool roof reflect?", ["More sunlight", "More indoor heat", "More rainwater"], "More sunlight", "凉屋顶表面比深色屋顶反射更多 sunlight。"),
      q("Which rooms benefited most in the school study?", ["Ground-floor offices", "Top-floor classrooms", "Basement classrooms"], "Top-floor classrooms", "研究中顶层教室降温最多，达到三度。"),
      q("When was the cooling effect smaller?", ["On cloudy days", "During school holidays", "After insulation improved"], "On cloudy days", "文中直接指出 cloudy days 效果较小。"),
      q("What should be improved alongside the roof?", ["Car parking", "Building insulation", "Window advertising"], "Building insulation", "讲座认为配合改善 insulation 时效果最好。"),
    ],
  },
  {
    id: "l40", skill: "listening", section: "Part 4", title: "家庭水表与用水研究", level: "模考", minutes: 18,
    focus: "行为变化、泄漏发现、公平问题与研究限制", audioFile: "l40.mp3", speakers: "Water policy lecturer",
    text: "Household water meters charge residents for the amount they use rather than a fixed annual fee. Studies often find an initial fall in consumption because people notice everyday habits and repair leaks sooner. However, the size of the reduction varies with climate, household size and the original price system. There is also a fairness concern: large low-income families may need more water for essential use. Some providers therefore offer reduced tariffs and free leak repairs. Researchers warn that comparing metered and unmetered homes can be misleading if the two groups differ before meters are installed.",
    questions: [
      q("How are metered households charged?", ["By household size", "By the amount of water used", "By a fixed national fee"], "By the amount of water used", "水表家庭按实际用水量收费。"),
      q("Why may consumption fall at first?", ["People identify habits and leaks", "The climate becomes cooler", "Families move to smaller homes"], "People identify habits and leaks", "居民会注意习惯并更早修理漏水。"),
      q("Which group may face a fairness problem?", ["Small wealthy households", "Large low-income families", "Homes with new bathrooms"], "Large low-income families", "必需用水较多的低收入大家庭可能承受不公平负担。"),
      q("What can make study comparisons misleading?", ["Groups may differ before installation", "Meters always record too little", "Fixed fees change every month"], "Groups may differ before installation", "安装前两组家庭可能本就不同，直接比较会误导。"),
    ],
  },
];

export const readingBatch04: CourseLesson[] = [
  {
    id: "r33", skill: "reading", section: "Section 1", title: "周末渡轮调整通知", level: "基础", minutes: 16,
    focus: "班次、登船、车辆与退款规则",
    text: "WEEKEND FERRY CHANGES\nOn Saturday 12 October, the 08:30 ferry from Eastport will leave at 09:10 because of harbour maintenance. All later departures will run normally. Foot passengers should check in 20 minutes before departure; drivers need 45 minutes. Bicycles travel free but must be booked because space is limited. Tickets for the delayed sailing remain valid. Passengers who no longer wish to travel may request a full refund online before 6 p.m. on Friday.",
    questions: [
      q("When will the first Saturday ferry leave?", ["08:30", "09:10", "09:30"], "09:10", "首班船因维护改到 09:10。"),
      q("How early should drivers check in?", ["20 minutes", "30 minutes", "45 minutes"], "45 minutes", "驾驶员需提前 45 分钟办理。"),
      q("What must cyclists do?", ["Pay an extra fee", "Book bicycle space", "Arrive on Friday"], "Book bicycle space", "自行车免费，但空间有限，必须预订。"),
      q("What is the refund deadline?", ["Friday at 6 p.m.", "Saturday at 8:30 a.m.", "Saturday at 9:10 a.m."], "Friday at 6 p.m.", "全额退款需在周五下午六点前在线申请。"),
    ],
  },
  {
    id: "r34", skill: "reading", section: "Section 1", title: "居民回收收集变更", level: "基础", minutes: 16,
    focus: "日期、分类、容器与漏收处理",
    text: "RECYCLING COLLECTION UPDATE\nFrom 1 November, paper and cardboard will be collected every second Tuesday instead of Friday. Glass and metal will continue weekly on Fridays. Flatten cardboard and place it inside the blue bin; material left beside the bin will not be taken. Rinse food containers, but labels can remain. Collections begin at 6:30 a.m., so bins may be placed outside after 7 p.m. the previous evening. Report a missed collection by noon the following working day.",
    questions: [
      q("When will paper be collected?", ["Every Tuesday", "Every second Tuesday", "Every Friday"], "Every second Tuesday", "纸张和纸板改为隔周周二收集。"),
      q("Which materials remain on a weekly Friday collection?", ["Paper and cardboard", "Glass and metal", "Food and garden waste"], "Glass and metal", "玻璃和金属仍每周五收集。"),
      q("Where must flattened cardboard be placed?", ["Inside the blue bin", "Beside the blue bin", "In a clear bag"], "Inside the blue bin", "放在箱旁不会收走，必须进入蓝色箱。"),
      q("When should a missed collection be reported?", ["By noon the next working day", "Within one week", "Before 7 p.m. the same day"], "By noon the next working day", "漏收需在下一个工作日中午前报告。"),
    ],
  },
  {
    id: "r35", skill: "reading", section: "Section 1", title: "社区剧院购票规定", level: "基础", minutes: 16,
    focus: "取票、换票、迟到与无障碍座位",
    text: "COMMUNITY THEATRE TICKETS\nOnline tickets may be shown on a phone or collected from the box office, which opens one hour before each performance. Exchanges are allowed up to 48 hours before the event and cost £3 per booking. Refunds are given only when a performance is cancelled. Latecomers will be admitted during a suitable break and may be offered different seats. Wheelchair spaces cannot be booked through the seating map; call the box office so a companion seat can be reserved at the same time.",
    questions: [
      q("When does the box office open?", ["30 minutes before", "One hour before", "Two hours before"], "One hour before", "售票处在演出前一小时开放。"),
      q("How much does a ticket exchange cost?", ["£3 per ticket", "£3 per booking", "Nothing"], "£3 per booking", "换票费用按 booking 收取三英镑。"),
      q("When are refunds available?", ["For late arrival", "When a performance is cancelled", "For any exchange request"], "When a performance is cancelled", "只有演出取消才退款。"),
      q("How should a wheelchair space be booked?", ["Through the seating map", "By calling the box office", "At the door only"], "By calling the box office", "轮椅位需致电售票处，同时安排陪同座位。"),
    ],
  },
  {
    id: "r36", skill: "reading", section: "Section 2", title: "客户资料处理规范", level: "进阶", minutes: 18,
    focus: "访问权限、传输、打印件与事故上报",
    text: "HANDLING CUSTOMER DATA\nAccess customer records only when required for your current task. Never share a login or leave an unlocked screen unattended. Send personal information through the approved secure system, not ordinary email or personal messaging apps. Collect printed documents immediately and place unwanted copies in a locked confidential-waste bin. Before discussing an account by phone, complete all identity checks shown on the call screen. Report a lost device, wrongly addressed message or suspicious request to Information Security within one hour, even if no harm is yet known.",
    questions: [
      q("When may staff access a customer record?", ["For training curiosity", "When needed for a current task", "Whenever a colleague asks"], "When needed for a current task", "只能在当前工作任务需要时访问。"),
      q("Which communication method is prohibited?", ["The approved secure system", "Ordinary email", "The call-screen process"], "Ordinary email", "个人信息不得通过普通邮件或私人通信软件发送。"),
      q("Where should unwanted printed copies go?", ["A normal recycling bin", "A locked confidential-waste bin", "The reception desk"], "A locked confidential-waste bin", "废弃打印件必须放入上锁的保密废弃箱。"),
      q("How quickly should a lost device be reported?", ["Within one hour", "By the end of the week", "Only after harm occurs"], "Within one hour", "即使尚未发现损害，也要一小时内报告。"),
    ],
  },
  {
    id: "r37", skill: "reading", section: "Section 2", title: "员工年假申请规则", level: "进阶", minutes: 18,
    focus: "提前期、冲突处理、结转与病假转换",
    text: "ANNUAL LEAVE REQUESTS\nSubmit requests of five working days or fewer at least two weeks in advance. Longer absences require six weeks' notice. Managers consider minimum staffing levels and the order in which requests were received; travel already booked does not guarantee approval. No more than five unused days may be carried into the next leave year unless the employee was unable to take leave because of long-term sickness or family leave. If you become ill during approved holiday, contact your manager that day and provide medical evidence to have the affected days recorded as sickness absence.",
    questions: [
      q("How much notice is needed for four days of leave?", ["One week", "Two weeks", "Six weeks"], "Two weeks", "五个工作日以内需至少提前两周。"),
      q("What does not guarantee approval?", ["Having booked travel", "Making an early request", "Maintaining staff levels"], "Having booked travel", "已订旅行不代表年假必定获批。"),
      q("What is the normal carry-over limit?", ["3 days", "5 days", "10 days"], "5 days", "通常最多结转五天。"),
      q("What should an employee do if ill during holiday?", ["Wait until returning", "Contact the manager that day", "Cancel all future leave"], "Contact the manager that day", "需当天联系经理并提供医疗证明。"),
    ],
  },
  {
    id: "r38", skill: "reading", section: "Section 2", title: "仓库人工搬运守则", level: "进阶", minutes: 18,
    focus: "风险评估、抬举动作、辅助设备与报告",
    text: "MANUAL HANDLING IN THE WAREHOUSE\nBefore moving an item, check its weight, shape and destination. Test the load gently rather than assuming the label is accurate. Use a trolley for bulky goods even when they are not especially heavy. Keep the load close to your body, bend at the knees and avoid twisting while lifting. Ask for help if the route includes steps or the item blocks your view. Damaged trolleys must be labelled and removed from use immediately. Report pain or a near miss before the end of the shift so the task can be reviewed.",
    questions: [
      q("What should workers do before relying on a weight label?", ["Test the load gently", "Open every package", "Ask a customer"], "Test the load gently", "规则要求轻试负载，不要直接相信标签。"),
      q("When should a trolley be used?", ["Only for very heavy goods", "For bulky goods", "Only on steps"], "For bulky goods", "体积大的物品即使不太重也要用推车。"),
      q("Which lifting action is recommended?", ["Twisting at the waist", "Keeping the load close", "Holding the load above the head"], "Keeping the load close", "应让物品靠近身体并屈膝。"),
      q("When must pain or a near miss be reported?", ["Before the shift ends", "At the monthly meeting", "Only if medical care is needed"], "Before the shift ends", "疼痛或险情需在当班结束前报告。"),
    ],
  },
  {
    id: "r39", skill: "reading", section: "Section 3", title: "社区小巴如何填补交通缺口", level: "模考", minutes: 22,
    focus: "服务对象、运营模式、局限与成功条件",
    text: "Community minibuses often operate where fixed public transport is too infrequent or expensive to provide. Their passengers may include older residents, people with disabilities and anyone living far from a main route. Some services follow a timetable, while others allow passengers to book a journey by phone. The second model can collect people closer to home, but planning an efficient route becomes harder when requests change daily.\n\nVolunteer drivers can keep costs down, although relying entirely on volunteers may make evening and weekend coverage unreliable. Paid coordinators are still needed to check licences, arrange vehicle maintenance and combine bookings. Digital booking can reduce administration, but a telephone option remains important for users without internet access.\n\nThe strongest schemes do not simply count passenger trips. They examine whether people can reach medical appointments, shops and social activities that were previously inaccessible. Local partnerships also matter: health centres may help fund journeys, while councils can provide accessible vehicles. A minibus will not replace a busy urban network, but in the right area it can prevent lack of transport from becoming isolation.",
    questions: [
      q("Where are community minibuses most useful?", ["On busy urban rail routes", "Where regular transport is limited", "Only between airports"], "Where regular transport is limited", "首段说明它们填补固定公共交通不足或成本过高的地区。"),
      q("What is a challenge of phone-booked journeys?", ["Routes are harder to plan", "Passengers cannot be collected near home", "Drivers need no licence"], "Routes are harder to plan", "每日需求变化会增加路线规划难度。"),
      q("Why is a paid coordinator still needed?", ["To sell private cars", "To manage licences, maintenance and bookings", "To replace every volunteer driver"], "To manage licences, maintenance and bookings", "协调员负责许可、车辆维护和合并预订。"),
      q("What does the writer consider a meaningful result?", ["More printed timetables", "Access to previously unreachable activities", "Replacing all city transport"], "Access to previously unreachable activities", "成功应看居民能否到达以前去不了的医疗、购物和社交活动。"),
    ],
  },
  {
    id: "r40", skill: "reading", section: "Section 3", title: "公共图书馆开始借工具", level: "模考", minutes: 22,
    focus: "共享价值、安全管理、需求证据与长期定位",
    text: "Libraries that lend tools apply a familiar idea to objects such as drills, sewing machines and gardening equipment. Many household items are needed only occasionally, so shared access can save residents money and reduce the number of products manufactured and stored. The service may also help people attempt repairs that they would otherwise pay someone else to do.\n\nManaging tools is more complex than lending books. Staff must inspect returned equipment, record damage and provide clear safety guidance. Some libraries require borrowers to complete a short demonstration before using powered tools. Charging a modest membership fee can support maintenance, but a high fee would exclude the residents who benefit most.\n\nSuccessful collections are shaped by local demand rather than by an impressive catalogue. A neighbourhood of flats may need small hand tools, while an area with gardens may borrow hedge cutters. Workshops led by experienced volunteers can build confidence and reveal which equipment people actually use. Tool lending therefore extends the library's educational role: it gives access not only to an object, but also to the knowledge needed to use it well.",
    questions: [
      q("Why are tools suitable for sharing?", ["They are always cheap", "Many are used only occasionally", "They require no storage"], "Many are used only occasionally", "很多家用工具只偶尔需要，因此适合共享。"),
      q("What may be required before borrowing a powered tool?", ["A short demonstration", "A professional qualification", "A large cash deposit"], "A short demonstration", "部分图书馆要求先完成简短操作演示。"),
      q("What should determine the collection?", ["The largest possible catalogue", "Local residents' needs", "The tools advertised nationally"], "Local residents' needs", "成功的收藏应由本地需求塑造。"),
      q("How does tool lending extend the library's role?", ["By selling equipment", "By giving objects and practical knowledge", "By replacing local workshops"], "By giving objects and practical knowledge", "结尾强调既提供物品，也提供正确使用所需知识。"),
    ],
  },
];

const task1Checklist = ["开头直接说明写信目的", "三个任务点都有具体事实、请求或安排", "语气符合正式或私人关系", "至少 150 词并检查时态、拼写和分段"];
const task2Checklist = ["引言回应题目并明确立场或范围", "主体段有中心句、解释和具体例子", "比较、因果或让步关系清楚", "至少 250 词且结论不加入新观点"];

export const writingBatch04: CourseLesson[] = [
  { id: "w33", skill: "writing", section: "Task 1 · 正式信", title: "申请调整上班时间", level: "进阶", minutes: 26, focus: "说明变化、提出方案并处理工作影响", task: "Your personal circumstances have changed and you would like to start and finish work at different times. Write a letter to your manager. Write at least 150 words.", bullets: ["explain why you need different hours", "suggest a specific new schedule", "explain how you will ensure your work is covered"], checklist: task1Checklist },
  { id: "w34", skill: "writing", section: "Task 1 · 私人信", title: "感谢朋友提供住宿", level: "进阶", minutes: 26, focus: "具体感谢、难忘细节与回请安排", task: "You recently stayed at a friend's home while visiting their city. Write a letter to your friend. Write at least 150 words.", bullets: ["thank your friend for the stay", "describe something you especially enjoyed", "invite your friend to visit you"], checklist: task1Checklist },
  { id: "w35", skill: "writing", section: "Task 1 · 正式信", title: "报告居民回收漏收", level: "进阶", minutes: 26, focus: "时间地点、实际影响与明确处理请求", task: "The recycling bins on your street have not been collected as scheduled. Write a letter to the local council. Write at least 150 words.", bullets: ["give the location and collection details", "explain the problems this has caused", "ask the council to take action and prevent a repeat"], checklist: task1Checklist },
  { id: "w36", skill: "writing", section: "Task 1 · 私人信", title: "邀请朋友参加本地节庆", level: "进阶", minutes: 26, focus: "活动亮点、适合原因与住宿交通安排", task: "A festival will take place in your area and you would like a friend to attend with you. Write a letter to your friend. Write at least 150 words.", bullets: ["describe the festival and its main events", "explain why your friend would enjoy it", "suggest travel and accommodation arrangements"], checklist: task1Checklist },
  { id: "w37", skill: "writing", section: "Task 2 · 优缺点", title: "每周工作四天", level: "模考", minutes: 42, focus: "区分员工、企业与服务连续性", task: "Some organisations are introducing a four-day working week without reducing employees' total pay. What are the advantages and disadvantages of this development? Write at least 250 words.", bullets: ["explain possible effects on wellbeing and productivity", "consider costs, workload and customer coverage", "use examples from different types of work"], checklist: task2Checklist },
  { id: "w38", skill: "writing", section: "Task 2 · 双边讨论", title: "市中心限制私家车", level: "模考", minutes: 42, focus: "比较环境、通行与公平影响", task: "Some people think private cars should be restricted in city centres, while others believe drivers should be free to enter. Discuss both views and give your own opinion. Write at least 250 words.", bullets: ["explain environmental and public-space benefits", "consider access needs and effects on businesses", "give a practical and clearly limited position"], checklist: task2Checklist },
  { id: "w39", skill: "writing", section: "Task 2 · 问题与对策", title: "社区中的孤独问题", level: "模考", minutes: 42, focus: "分析人群、成因与可执行干预", task: "Many people experience loneliness even when they live in busy communities. What causes this problem, and what measures could reduce it? Write at least 250 words.", bullets: ["identify social or practical causes", "explain which groups may be especially affected", "evaluate community, workplace or government responses"], checklist: task2Checklist },
  { id: "w40", skill: "writing", section: "Task 2 · 观点", title: "维修物品还是直接更换", level: "模考", minutes: 42, focus: "限定同意程度并处理成本与技能因素", task: "People should repair and reuse household items instead of replacing them with new products. To what extent do you agree or disagree? Write at least 250 words.", bullets: ["state the extent of your agreement", "explain environmental and financial effects", "consider safety, repair cost and access to skills"], checklist: task2Checklist },
];

export const speakingBatch04: CourseLesson[] = [
  { id: "s33", skill: "speaking", section: "Part 1", title: "早晨习惯", level: "进阶", minutes: 10, focus: "日常顺序、偏好、过去变化和改进", prompts: ["What do you usually do first in the morning?", "Do you prefer busy or quiet mornings?", "Were your mornings different when you were younger?", "Is there anything you would like to change about your morning routine?"], keywords: ["usually", "prefer", "used to", "would like"] },
  { id: "s34", skill: "speaking", section: "Part 1", title: "包与随身物品", level: "进阶", minutes: 10, focus: "用途、选择、丢失经历与未来偏好", prompts: ["Do you carry a bag most days?", "What do you normally keep in it?", "Have you ever lost something important from a bag?", "What kind of bag would you choose for a long journey?"], keywords: ["most days", "normally", "once", "would"] },
  { id: "s35", skill: "speaking", section: "Part 1", title: "本地商店", level: "进阶", minutes: 10, focus: "频率、服务、变化与选择原因", prompts: ["What local shops do you use regularly?", "Is good service important when you shop?", "Have shops in your area changed in recent years?", "Do you prefer small shops or large stores?"], keywords: ["regularly", "because", "have changed", "prefer"] },
  { id: "s36", skill: "speaking", section: "Part 2", title: "经常使用的公共服务", level: "进阶", minutes: 14, focus: "服务内容、使用过程、优点与改进", task: "Describe a public service that you use or have used.", bullets: ["what the service is", "when and why you use it", "what works well", "how it could be improved"], prompts: ["You have one minute to prepare. Then speak for up to two minutes."], keywords: ["provided", "usually", "useful", "could"] },
  { id: "s37", skill: "speaking", section: "Part 2", title: "收到有用建议的一次经历", level: "进阶", minutes: 14, focus: "问题背景、建议内容、行动与结果", task: "Describe a time when someone gave you useful advice.", bullets: ["who gave you the advice", "what situation you were in", "what the person suggested", "what happened after you followed it"], prompts: ["You have one minute to prepare. Then speak for up to two minutes."], keywords: ["at the time", "suggested", "therefore", "result"] },
  { id: "s38", skill: "speaking", section: "Part 2", title: "与他人共同解决问题", level: "进阶", minutes: 14, focus: "分工、沟通、困难和最终成果", task: "Describe a problem that you solved together with another person.", bullets: ["what the problem was", "who worked with you", "what each person did", "why the solution succeeded"], prompts: ["You have one minute to prepare. Then speak for up to two minutes."], keywords: ["problem", "while", "agreed", "managed"] },
  { id: "s39", skill: "speaking", section: "Part 3", title: "本地商业与城镇中心", level: "模考", minutes: 16, focus: "比较规模、消费者选择、政策与未来变化", prompts: ["Why do some people prefer small local businesses?", "Can large stores benefit a town centre?", "Should local governments support independent shops?", "How might town centres change as online shopping grows?"], keywords: ["one reason", "whereas", "should", "might"] },
  { id: "s40", skill: "speaking", section: "Part 3", title: "工作时间与休息", level: "模考", minutes: 16, focus: "生产率、行业差异、责任和长期趋势", prompts: ["Why do working hours differ between occupations?", "Does working fewer days always improve productivity?", "Who is responsible for protecting employees' free time?", "How might working schedules change in the future?"], keywords: ["depends", "however", "responsible", "in the future"] },
];

export const curriculumBatch04: CourseLesson[] = [
  ...listeningBatch04,
  ...readingBatch04,
  ...writingBatch04,
  ...speakingBatch04,
];
