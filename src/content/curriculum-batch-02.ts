import type { ChoiceQuestion, CourseLesson } from "./curriculum-v2";

const q = (prompt: string, options: string[], answer: string, explanation: string): ChoiceQuestion => ({ prompt, options, answer, explanation });

export const listeningBatch02: CourseLesson[] = [
  {
    id: "l17", skill: "listening", section: "Part 1", title: "搬家后的电力账户", level: "基础", minutes: 15,
    focus: "地址、日期、数字与后续安排", audioFile: "l17.mp3", speakers: "Energy adviser + customer",
    text: "Adviser: North Power, how can I help? Customer: I'm moving and need to close the account at 14 Lime Street. Adviser: What date are you leaving? Customer: The twelfth of August. My new address is 82 Park Road, Bristol. Adviser: And your final meter reading? Customer: Four six three seven. Adviser: Thank you. Would you like the final bill by post? Customer: Email is better. Please keep the direct debit active until the final payment has been taken.",
    questions: [
      q("When will the customer leave Lime Street?", ["2 August", "12 August", "20 August"], "12 August", "客户明确说 the twelfth of August。"),
      q("What is the new house number?", ["28", "72", "82"], "82", "新地址是 82 Park Road。"),
      q("What is the final meter reading?", ["4367", "4637", "4673"], "4637", "数字按顺序读作 four six three seven。"),
      q("How should the final bill be sent?", ["By email", "By post", "By text message"], "By email", "客户回答 Email is better。"),
    ],
  },
  {
    id: "l18", skill: "listening", section: "Part 1", title: "报名夜间摄影课", level: "基础", minutes: 15,
    focus: "课程时间、地点、费用与物品", audioFile: "l18.mp3", speakers: "Course assistant + learner",
    text: "Assistant: Riverside Adult College. Learner: I'd like to join the evening photography course. Assistant: The eight-week course starts on Tuesday the sixth of September at seven. It is in Room B12. Learner: How much is it? Assistant: Ninety-six pounds. You can use the college cameras, but you need to bring your own memory card. Learner: That's fine. Assistant: Please arrive fifteen minutes early on the first evening to collect your student card.",
    questions: [
      q("How long is the course?", ["6 weeks", "8 weeks", "12 weeks"], "8 weeks", "开头说明是 the eight-week course。"),
      q("Where will the class meet?", ["Room B12", "Room D12", "Studio B20"], "Room B12", "地点明确为 Room B12。"),
      q("What does the learner need to bring?", ["A camera", "A memory card", "A student card"], "A memory card", "相机可借用，但要自带 memory card。"),
      q("How early should the learner arrive on the first evening?", ["10 minutes", "15 minutes", "30 minutes"], "15 minutes", "结尾要求 arrive fifteen minutes early。"),
    ],
  },
  {
    id: "l19", skill: "listening", section: "Part 2", title: "社区花园入园说明", level: "进阶", minutes: 16,
    focus: "单人说明中的路线、规则与时间", audioFile: "l19.mp3", speakers: "Garden coordinator",
    text: "Welcome to Hillview Community Garden. On Saturday, enter through the north gate, which opens at eight. New members should meet beside the greenhouse at eight thirty for a short induction. Tools are kept in the wooden shed, but please return them before the garden closes at one. Your group will work on Plot 14 near the water tanks. We do not use chemical weed killers here. At midday, tea is provided in the kitchen, although members should bring their own lunch.",
    questions: [
      q("Which entrance should new members use?", ["The east gate", "The north gate", "The main car park"], "The north gate", "第一条指示是 enter through the north gate。"),
      q("Where does the induction take place?", ["Beside the greenhouse", "Inside the kitchen", "Near the tool shed"], "Beside the greenhouse", "新人八点半在 greenhouse 旁集合。"),
      q("Which plot will the group work on?", ["Plot 4", "Plot 14", "Plot 40"], "Plot 14", "说明直接给出 Plot 14。"),
      q("What should members bring?", ["Their own tools", "Their own tea", "Their own lunch"], "Their own lunch", "茶提供，但午饭需自带。"),
    ],
  },
  {
    id: "l20", skill: "listening", section: "Part 2", title: "博物馆志愿者简报", level: "进阶", minutes: 16,
    focus: "工作安排、入口、标识与安全程序", audioFile: "l20.mp3", speakers: "Volunteer manager",
    text: "Thank you for volunteering at Barton Museum. On your first day, arrive at the staff entrance on King Lane at nine fifteen. Do not use the public entrance. At reception you will receive a blue name badge and a locker key. The morning session is in the transport gallery, where you will help visitors find exhibits. Lunch is provided, but bring a bottle of water. If the fire alarm sounds, guide visitors to the courtyard and report to the senior guide wearing a red badge.",
    questions: [
      q("What time should volunteers arrive?", ["9:05", "9:15", "9:50"], "9:15", "到达时间是 nine fifteen。"),
      q("What colour is the volunteer name badge?", ["Blue", "Green", "Red"], "Blue", "志愿者领取 blue name badge。"),
      q("Where will volunteers work in the morning?", ["The art gallery", "The transport gallery", "The courtyard"], "The transport gallery", "上午安排在 transport gallery。"),
      q("Where should visitors go during a fire alarm?", ["The car park", "The public entrance", "The courtyard"], "The courtyard", "火警时引导访客去 courtyard。"),
    ],
  },
  {
    id: "l21", skill: "listening", section: "Part 3", title: "员工培训项目讨论", level: "进阶", minutes: 17,
    focus: "方案改变、理由、任务分工与截止日", audioFile: "l21.mp3", speakers: "Tutor + two trainees",
    text: "Tutor: How is your staff orientation project going? Mina: We planned to make a video, but editing would take too long. Joel: So we suggest a poster and a five-minute talk. Tutor: That is more realistic. What evidence will you use? Mina: We will survey twenty new employees about their first week. Joel: I'll design the questions, and Mina will analyse the answers. Tutor: Good. Show me the draft poster on Friday. Your final presentation is next Wednesday, not Monday as written on the old schedule.",
    questions: [
      q("Why did the trainees reject the video idea?", ["It was too expensive", "Editing would take too long", "They had no camera"], "Editing would take too long", "Mina 说明剪辑耗时过长。"),
      q("How many employees will they survey?", ["12", "20", "25"], "20", "调查对象是 twenty new employees。"),
      q("What will Mina do?", ["Design the questions", "Analyse the answers", "Give the whole talk"], "Analyse the answers", "分工中 Mina 负责分析答案。"),
      q("When is the final presentation?", ["Friday", "Next Monday", "Next Wednesday"], "Next Wednesday", "导师纠正旧日程，确认 next Wednesday。"),
    ],
  },
  {
    id: "l22", skill: "listening", section: "Part 3", title: "通勤调查方案修改", level: "进阶", minutes: 17,
    focus: "研究方法、样本、偏差与试测", audioFile: "l22.mp3", speakers: "Tutor + two students",
    text: "Tutor: Tell me about your transport survey. Ravi: We want to interview sixty commuters outside Central Station between seven and nine in the morning. Hana: Our first question asks whether people agree that buses are unreliable. Tutor: That wording may lead people towards one answer. Ask how often their bus arrives late instead. Ravi: We should test the questions first. Tutor: Yes, pilot them with five classmates. Hana: We can do that tomorrow and submit the revised survey on the eighteenth of May.",
    questions: [
      q("Where will the main survey take place?", ["At a bus depot", "Outside Central Station", "Inside a college"], "Outside Central Station", "调查地点是 Central Station 外。"),
      q("What problem does the tutor identify?", ["The sample is too large", "The first question is leading", "The survey time is too short"], "The first question is leading", "导师认为原问题会引导答案。"),
      q("Who will take part in the pilot?", ["Five classmates", "Five bus drivers", "Sixty commuters"], "Five classmates", "试测对象是 five classmates。"),
      q("When is the revised survey due?", ["8 May", "18 May", "28 May"], "18 May", "提交日期明确为 the eighteenth of May。"),
    ],
  },
  {
    id: "l23", skill: "listening", section: "Part 4", title: "夜班工作与睡眠", level: "模考", minutes: 18,
    focus: "讲座主旨、因果关系、建议与数字", audioFile: "l23.mp3", speakers: "Health lecturer",
    text: "Night work can disturb the body's internal clock because light normally tells the brain when to be awake. Workers often try to solve tiredness with coffee, but caffeine during the final four hours of a shift can delay sleep. A short nap before work may help; research suggests about twenty minutes, since a longer nap can leave people less alert. After a night shift, the bedroom should be dark, quiet and cool. Regular meal times also help the body adjust better than eating one large meal before bed.",
    questions: [
      q("What normally tells the brain when to be awake?", ["Light", "Food", "Exercise"], "Light", "讲座说明 light 调节大脑的清醒信号。"),
      q("When should workers avoid caffeine?", ["At the start of a shift", "During the final four hours", "Only after they wake up"], "During the final four hours", "建议避免最后四小时摄入咖啡因。"),
      q("How long should a short nap be?", ["About 10 minutes", "About 20 minutes", "About 40 minutes"], "About 20 minutes", "研究建议 about twenty minutes。"),
      q("Which bedroom condition is recommended?", ["Warm and bright", "Dark, quiet and cool", "Cool with music playing"], "Dark, quiet and cool", "原文连续列出 dark, quiet and cool。"),
    ],
  },
  {
    id: "l24", skill: "listening", section: "Part 4", title: "维修咖啡馆与减少浪费", level: "模考", minutes: 18,
    focus: "历史、功能、数据与结论", audioFile: "l24.mp3", speakers: "Community studies lecturer",
    text: "The first Repair Cafe opened in Amsterdam in 2009. These events bring residents and volunteer repairers together to fix small electrical items, clothes and bicycles. Their purpose is not only to reduce waste but also to share practical skills. Electrical items must pass a safety test before owners take them home. In one local survey, seventy-two per cent of items were repaired successfully. However, participants said the greatest benefit was confidence: after watching a repair, many felt able to maintain other possessions themselves.",
    questions: [
      q("Where did the first Repair Cafe open?", ["Amsterdam", "Berlin", "London"], "Amsterdam", "首家维修咖啡馆在 Amsterdam。"),
      q("What must happen before an electrical item goes home?", ["It must be photographed", "It must pass a safety test", "It must be registered online"], "It must pass a safety test", "电器带回前必须通过安全测试。"),
      q("What percentage of items were repaired in the survey?", ["27%", "62%", "72%"], "72%", "数据是 seventy-two per cent。"),
      q("What did participants consider the greatest benefit?", ["Saving money", "Gaining confidence", "Meeting neighbours"], "Gaining confidence", "参与者认为最大收益是 confidence。"),
    ],
  },
];

export const readingBatch02: CourseLesson[] = [
  {
    id: "r17", skill: "reading", section: "Section 1", title: "夜间药房通知", level: "基础", minutes: 16,
    focus: "公告中的开放时间、资格与紧急程序",
    text: "NIGHT PHARMACY SERVICE\nThe High Street Pharmacy window is open from 10 p.m. to 2 a.m. every day. Ring the bell once and wait by the marked window. This service is for urgent prescriptions issued that day. It does not sell cosmetics or general shopping items overnight. Between 2 a.m. and 6 a.m., patients should call the non-emergency health line on 111. If someone has difficulty breathing or is unconscious, call emergency services instead.",
    questions: [
      q("When does the pharmacy window close?", ["2 a.m.", "6 a.m.", "10 p.m."], "2 a.m.", "通知首句给出 10 p.m. 至 2 a.m.。"),
      q("Which item can be collected overnight?", ["An urgent prescription issued today", "A bottle of shampoo", "A routine prescription from last month"], "An urgent prescription issued today", "夜间服务仅处理当天开具的紧急处方。"),
      q("What should patients do between 2 a.m. and 6 a.m. for a non-emergency?", ["Wait outside", "Call 111", "Call the pharmacy manager"], "Call 111", "通知明确要求拨打 111。"),
      q("A person who is unconscious should be dealt with by calling emergency services.", ["True", "False", "Not Given"], "True", "最后一句直接确认该做法。"),
    ],
  },
  {
    id: "r18", skill: "reading", section: "Section 1", title: "休闲中心会员方案", level: "基础", minutes: 16,
    focus: "比较价格、时间限制与包含项目",
    text: "RIVERSIDE LEISURE MEMBERSHIPS\nAnytime: £42 a month. Use the gym and pool whenever the centre is open; two fitness classes are included each week.\nDaytime: £28 a month. Entry is Monday to Friday before 4 p.m.; pool use is included, but classes cost £4 each.\nSwim Only: £19 a month. Pool entry at all opening times; the gym is not included.\nAll plans require a £15 joining fee. Members may pause a plan for one or two complete months with medical evidence.",
    questions: [
      q("Which plan includes two weekly fitness classes?", ["Anytime", "Daytime", "Swim Only"], "Anytime", "Anytime 方案每周含两节课。"),
      q("When can a Daytime member enter?", ["Before 4 p.m. on weekdays", "After 4 p.m. on weekdays", "At any time on weekends"], "Before 4 p.m. on weekdays", "Daytime 限周一至周五下午四点前。"),
      q("How much is the joining fee?", ["£4", "£15", "£19"], "£15", "所有方案另收 £15 joining fee。"),
      q("Members can pause a plan without giving a reason.", ["True", "False", "Not Given"], "False", "暂停需要 medical evidence。"),
    ],
  },
  {
    id: "r19", skill: "reading", section: "Section 1", title: "家庭回收日历", level: "基础", minutes: 16,
    focus: "日期、物品分类与例外规则",
    text: "GREEN BIN COLLECTIONS\nFood and garden waste is collected every Wednesday. Put bins outside after 7 p.m. on Tuesday and before 6:30 a.m. on Wednesday. Do not place plastic bags in the green bin, even if they are labelled biodegradable. Small branches are accepted if they are shorter than one metre. During the week beginning 24 December, the collection moves from Wednesday to Friday. Missed collections must be reported online by noon on the following day.",
    questions: [
      q("What is normally collected on Wednesday?", ["Glass and paper", "Food and garden waste", "Electrical equipment"], "Food and garden waste", "标题下第一句给出收集类别。"),
      q("What is the latest normal time to put out a bin?", ["6:30 a.m. Wednesday", "7 p.m. Wednesday", "Noon Thursday"], "6:30 a.m. Wednesday", "要求在周三早上六点半前放出。"),
      q("Which branches are accepted?", ["All branches", "Branches under one metre", "Only branches in plastic bags"], "Branches under one metre", "长度必须短于一米。"),
      q("When is collection during the week beginning 24 December?", ["Tuesday", "Wednesday", "Friday"], "Friday", "圣诞周改到 Friday。"),
    ],
  },
  {
    id: "r20", skill: "reading", section: "Section 2", title: "工作场所事故报告", level: "进阶", minutes: 18,
    focus: "程序顺序、责任人与时间限制",
    text: "ACCIDENT REPORTING PROCEDURE\nFirst make the area safe and contact a trained first aider if anyone is injured. The employee involved must tell the shift supervisor before leaving work, even if the injury appears minor. The supervisor records the basic facts in the digital incident log before the end of the shift. Photographs may be added, but staff must not photograph an injured person without permission. The Health and Safety Manager reviews all reports within two working days and decides whether further investigation is required. Near misses follow the same process, although no medical section is needed.",
    questions: [
      q("What should happen first after an accident?", ["Complete the digital log", "Make the area safe", "Take photographs"], "Make the area safe", "程序第一步是确保现场安全。"),
      q("Who enters the basic facts in the incident log?", ["The injured employee", "The shift supervisor", "The first aider"], "The shift supervisor", "记录责任属于 shift supervisor。"),
      q("When are photographs of an injured person allowed?", ["When the supervisor asks", "When the person gives permission", "Whenever the injury is serious"], "When the person gives permission", "没有本人许可不得拍摄。"),
      q("Near misses require a medical section.", ["True", "False", "Not Given"], "False", "最后一句说明 near miss 不需要 medical section。"),
    ],
  },
  {
    id: "r21", skill: "reading", section: "Section 2", title: "灵活工作申请政策", level: "进阶", minutes: 18,
    focus: "申请条件、证据、决定与复核",
    text: "FLEXIBLE WORKING REQUESTS\nEmployees who have completed 26 weeks of service may submit one formal request in any six-month period. The request must describe the proposed working pattern, the preferred start date and any likely effect on colleagues or customers. Managers should meet the employee within 14 days unless both sides agree that a meeting is unnecessary. A written decision normally follows within seven days of the meeting. If a request is refused, the letter must give a clear business reason. Employees may ask a different manager to review the procedure, but this is not a second decision on whether the pattern is convenient.",
    questions: [
      q("Who may make a formal request?", ["Any new employee", "An employee with 26 weeks of service", "Only a department manager"], "An employee with 26 weeks of service", "资格门槛是完成 26 周服务。"),
      q("What must the request discuss?", ["The employee's salary", "Possible effects on colleagues or customers", "The manager's preferred hours"], "Possible effects on colleagues or customers", "申请必须说明对同事或客户的潜在影响。"),
      q("When is a written decision normally sent?", ["Within 7 days of the meeting", "Within 14 days of the request", "After 26 weeks"], "Within 7 days of the meeting", "会面后通常七天内书面决定。"),
      q("A procedural review guarantees a different final decision.", ["True", "False", "Not Given"], "False", "复核程序不等于重新判断安排是否方便。"),
    ],
  },
  {
    id: "r22", skill: "reading", section: "Section 2", title: "社区护理助理招聘", level: "进阶", minutes: 18,
    focus: "职位要求、培训、排班与申请材料",
    text: "COMMUNITY CARE ASSISTANT\nWe need reliable assistants to visit older clients in their own homes. Duties include preparing simple meals, collecting prescriptions and recording changes in a client's condition. Previous care experience is helpful but not essential because paid training is provided. Applicants must have a full driving licence and access to a vehicle. Shifts include two evenings each week and one weekend in four. The starting rate is £13.20 per hour, plus mileage. Apply with a CV and a short statement explaining how you would respond if a client refused help.",
    questions: [
      q("Which task is part of the role?", ["Prescribing medicine", "Collecting prescriptions", "Repairing clients' homes"], "Collecting prescriptions", "职责列表包含 collecting prescriptions。"),
      q("What is essential for applicants?", ["Previous care experience", "A nursing qualification", "Access to a vehicle"], "Access to a vehicle", "经验不是必需，但必须有驾照和车辆。"),
      q("How often is weekend work required?", ["Every weekend", "One weekend in four", "Two weekends each month"], "One weekend in four", "排班明确为 one weekend in four。"),
      q("What should the short statement explain?", ["Why the applicant wants higher pay", "How to respond when a client refuses help", "How to plan a weekly route"], "How to respond when a client refuses help", "申请说明需回答客户拒绝帮助的情形。"),
    ],
  },
  {
    id: "r23", skill: "reading", section: "Section 3", title: "公共图书馆角色的变化", level: "模考", minutes: 22,
    focus: "长文主旨、事实定位、观点与推断",
    text: "Public libraries were once judged mainly by the size of their book collections. That measure is now incomplete. In many towns, the library is one of the few indoor public places where a person can stay without being expected to buy anything. This has changed both the people who use libraries and the work of library staff.\n\nDigital services have not removed the need for a physical building. Although many users download books from home, others visit because they lack a reliable internet connection or need help completing an online form. Libraries increasingly lend laptops, provide quiet work areas and run basic digital-skills sessions. These services are particularly important when employers, banks and government departments move their procedures online.\n\nThe wider role creates tension. Quiet readers may be disturbed by children's activities or group classes, while staff must deal with questions that were once handled by other public offices. Successful libraries respond by dividing space according to purpose and by training staff to guide users without pretending to be legal or welfare specialists. Their future may therefore depend less on storing information than on helping people reach and understand it.",
    questions: [
      q("Why is collection size no longer a complete measure of a library?", ["Libraries now serve wider public needs", "Most libraries have stopped buying books", "Visitors only use digital books"], "Libraries now serve wider public needs", "首段说明图书馆已承担无需消费的公共空间等更广角色。"),
      q("Why do some people visit for digital services?", ["They cannot read printed books", "They lack reliable internet or need help", "They want to buy a laptop"], "They lack reliable internet or need help", "第二段直接列出网络不足与表格帮助。"),
      q("What tension is mentioned?", ["Staff refuse to run classes", "Different activities require different noise levels", "Government offices compete with libraries"], "Different activities require different noise levels", "安静阅读与儿童活动、团体课程之间存在冲突。"),
      q("What does the writer suggest about the future of libraries?", ["They will become legal advice centres", "They will focus only on storing information", "Helping people access and understand information will be central"], "Helping people access and understand information will be central", "末句明确从储存信息转向帮助获取和理解信息。"),
    ],
  },
  {
    id: "r24", skill: "reading", section: "Section 3", title: "城市树木的隐形价值", level: "模考", minutes: 22,
    focus: "论证结构、因果关系、限制条件与结论",
    text: "City trees are often discussed as decoration, yet their practical value is easier to measure than many people assume. Shade from mature trees lowers surface temperatures on streets and buildings. Leaves slow heavy rain before it reaches drainage systems, and roots help water enter the soil. Trees can also make walking routes more pleasant, encouraging short journeys on foot.\n\nThese benefits are not automatic. A species that grows well in a park may damage a narrow pavement, while a newly planted tree provides little shade for years. Young trees need regular watering and protection from vehicles. If maintenance budgets cover planting but not long-term care, highly publicised projects may produce rows of dead trees rather than cooler streets.\n\nGood planning therefore begins with the problem a neighbourhood needs to solve. A hot shopping street may require broad shade, whereas a flood-prone area needs soil and planting designs that hold water. Residents also need to be involved early, especially where trees could block shop signs or reduce parking. Counting how many trees are planted is simple; measuring survival and the benefits delivered over decades is more meaningful.",
    questions: [
      q("How can leaves help during heavy rain?", ["They clean drainage pipes", "They slow water before it reaches drains", "They prevent all water entering soil"], "They slow water before it reaches drains", "首段说明树叶减缓雨水进入排水系统。"),
      q("Why might a planting project fail?", ["Mature trees grow too quickly", "Long-term maintenance is not funded", "Residents always oppose shade"], "Long-term maintenance is not funded", "第二段强调只付种植、不付养护会导致树木死亡。"),
      q("What should determine the planting design?", ["The cheapest available species", "The number of shop signs", "The local problem to be solved"], "The local problem to be solved", "第三段首句提出从社区具体问题出发。"),
      q("Which measure does the writer prefer?", ["The number planted on opening day", "Survival and long-term benefits", "The amount spent on publicity"], "Survival and long-term benefits", "结尾认为长期存活和实际收益更有意义。"),
    ],
  },
];

const task1Checklist = [
  "开头直接说明写信目的，不照抄题目",
  "三个任务点各有具体信息或请求",
  "称呼、语气和结尾符合收信人关系",
  "至少 150 词，并检查时态、拼写和段落",
];
const task2Checklist = [
  "引言完整回应题目并给出清晰立场",
  "主体段各有一个中心句、解释和具体例子",
  "连接词表达真实逻辑，不机械堆叠",
  "至少 250 词，结论不加入新观点",
];

export const writingBatch02: CourseLesson[] = [
  { id: "w17", skill: "writing", section: "Task 1 · 正式信", title: "行李延误投诉", level: "进阶", minutes: 26, focus: "事件顺序、影响与明确解决方案", task: "Your suitcase did not arrive after a flight, and the airline has not updated you for three days. Write a letter to the airline. Write at least 150 words.", bullets: ["give the flight and baggage details", "explain how the delay has affected you", "state what information and action you expect"], checklist: task1Checklist },
  { id: "w18", skill: "writing", section: "Task 1 · 半正式信", title: "与邻居协商装修噪音", level: "进阶", minutes: 26, focus: "礼貌说明影响并提出可执行安排", task: "Your neighbour is doing noisy building work at times that disturb your household. Write a letter to your neighbour. Write at least 150 words.", bullets: ["describe when the noise occurs", "explain who is affected and how", "suggest a timetable that could work for both households"], checklist: task1Checklist },
  { id: "w19", skill: "writing", section: "Task 1 · 正式信", title: "询问职业培训细节", level: "进阶", minutes: 26, focus: "背景、精准提问与报名条件", task: "You are interested in a professional training course advertised by a local college. Write a letter to the course administrator. Write at least 150 words.", bullets: ["explain your relevant work background", "ask about assessment and class times", "ask whether financial support is available"], checklist: task1Checklist },
  { id: "w20", skill: "writing", section: "Task 1 · 私人信", title: "帮助朋友安排本地短住", level: "进阶", minutes: 26, focus: "自然语气、建议理由与实际安排", task: "A friend will spend one week in your area while attending an event. Write a letter to your friend. Write at least 150 words.", bullets: ["offer advice about where to stay", "recommend transport and places to eat", "suggest something you can do together after the event"], checklist: task1Checklist },
  { id: "w21", skill: "writing", section: "Task 2 · 问题与对策", title: "公共服务全面线上化", level: "模考", minutes: 42, focus: "识别受影响群体并评估解决方案", task: "More public services are becoming available only online. What problems can this cause, and what solutions could governments provide? Write at least 250 words.", bullets: ["identify two significant problems", "explain which groups are most affected", "evaluate practical online and offline solutions"], checklist: task2Checklist },
  { id: "w22", skill: "writing", section: "Task 2 · 双边讨论", title: "学历还是实际技能", level: "模考", minutes: 42, focus: "比较标准并给出有条件的立场", task: "Some employers value formal qualifications most, while others prefer practical skills and experience. Discuss both views and give your own opinion. Write at least 250 words.", bullets: ["explain why qualifications can matter", "explain the value of skills and experience", "give a clear view with suitable job examples"], checklist: task2Checklist },
  { id: "w23", skill: "writing", section: "Task 2 · 观点", title: "公共资金用于体育还是健康", level: "模考", minutes: 42, focus: "限定立场、因果链与现实例证", task: "Some people think governments should spend more on public sports facilities, while others believe other health measures are more important. Discuss both views and give your own opinion. Write at least 250 words.", bullets: ["explain the possible health value of sports facilities", "discuss other effective health measures", "justify how public money should be balanced"], checklist: task2Checklist },
  { id: "w24", skill: "writing", section: "Task 2 · 优缺点", title: "租房与买房", level: "模考", minutes: 42, focus: "区分个人条件并避免绝对化", task: "In some countries, many adults prefer to buy a home rather than rent one. What are the advantages and disadvantages of home ownership? Write at least 250 words.", bullets: ["explain financial or personal advantages", "explain risks and limitations", "use examples from different life stages"], checklist: task2Checklist },
];

export const speakingBatch02: CourseLesson[] = [
  { id: "s17", skill: "speaking", section: "Part 1", title: "公共交通习惯", level: "进阶", minutes: 10, focus: "频率、原因、过去与未来", prompts: ["How often do you use public transport?", "What do you usually do during the journey?", "Was transport in your area different when you were younger?", "What change would improve your daily journey?"], keywords: ["usually", "because", "used to", "would"] },
  { id: "s18", skill: "speaking", section: "Part 1", title: "周末安排", level: "进阶", minutes: 10, focus: "习惯、偏好与具体例子", prompts: ["What do you normally do at weekends?", "Do you prefer busy or quiet weekends?", "Did you spend last weekend differently?", "Is there a weekend activity you would like to try?"], keywords: ["normally", "prefer", "last", "would like"] },
  { id: "s19", skill: "speaking", section: "Part 1", title: "做饭与饮食", level: "进阶", minutes: 10, focus: "描述过程并解释偏好", prompts: ["How often do you cook?", "What is a meal you can prepare well?", "Who taught you to cook?", "Do you think people will cook more or less in the future?"], keywords: ["often", "prepare", "learned", "future"] },
  { id: "s20", skill: "speaking", section: "Part 2", title: "帮助过你的人", level: "进阶", minutes: 14, focus: "按时间组织两分钟叙述", task: "Describe a person who helped you solve a practical problem.", bullets: ["who the person was", "what the problem was", "what the person did", "why the help was important"], prompts: ["You have one minute to prepare. Then speak for up to two minutes."], keywords: ["problem", "suggested", "managed", "important"] },
  { id: "s21", skill: "speaking", section: "Part 2", title: "经常使用的物品", level: "进阶", minutes: 14, focus: "描述外观、用途与个人意义", task: "Describe an object that is useful in your daily life.", bullets: ["what the object is", "when you got it", "how you use it", "why it is useful to you"], prompts: ["You have one minute to prepare. Then speak for up to two minutes."], keywords: ["received", "usually", "allows", "without"] },
  { id: "s22", skill: "speaking", section: "Part 2", title: "繁忙的公共场所", level: "进阶", minutes: 14, focus: "空间描写、人物活动与感受", task: "Describe a busy public place that you have visited.", bullets: ["where it was", "when you went there", "what people were doing", "how you felt about the place"], prompts: ["You have one minute to prepare. Then speak for up to two minutes."], keywords: ["located", "crowded", "while", "felt"] },
  { id: "s23", skill: "speaking", section: "Part 3", title: "社区志愿服务", level: "模考", minutes: 16, focus: "解释原因、比较责任与预测变化", prompts: ["Why do some people volunteer in their community?", "Should employers give staff time for volunteer work?", "Are small local charities more effective than large organisations?", "How might volunteering change in the future?"], keywords: ["one reason", "whereas", "for example", "might"] },
  { id: "s24", skill: "speaking", section: "Part 3", title: "技术如何改变工作", level: "模考", minutes: 16, focus: "分析影响、让步与有条件结论", prompts: ["Which jobs have changed most because of technology?", "Does working from home benefit employees and employers equally?", "Should companies retrain workers when technology replaces tasks?", "What skills will be most valuable in the future?"], keywords: ["although", "depends", "responsible", "in the future"] },
];

export const curriculumBatch02: CourseLesson[] = [
  ...listeningBatch02,
  ...readingBatch02,
  ...writingBatch02,
  ...speakingBatch02,
];
