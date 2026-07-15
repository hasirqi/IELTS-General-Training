import type { ChoiceQuestion, CourseLesson } from "./curriculum-v2";

const q = (prompt: string, options: string[], answer: string, explanation: string): ChoiceQuestion => ({ prompt, options, answer, explanation });

export const listeningBatch03: CourseLesson[] = [
  {
    id: "l25", skill: "listening", section: "Part 1", title: "预约家庭网络维修", level: "基础", minutes: 15,
    focus: "账户、地址、故障表现与预约时段", audioFile: "l25.mp3", speakers: "Internet adviser + customer",
    text: "Adviser: CityNet support. Customer: My home internet stopped working yesterday. Adviser: May I have the account number? Customer: C N four eight two one. The address is Flat 7, 36 Mill Road. Adviser: What lights can you see on the router? Customer: The power light is green, but the internet light is red. Adviser: An engineer can visit on Thursday between two and four. Customer: That's fine. Adviser: Your reference is R 915. Please keep the router switched on.",
    questions: [
      q("What is the account number?", ["CN 4281", "CN 4821", "NC 4821"], "CN 4821", "账户号逐字读作 C N four eight two one。"),
      q("What is the house number?", ["7", "36", "48"], "36", "Flat 7 是公寓号，门牌号是 36 Mill Road。"),
      q("Which router light is red?", ["The internet light", "The power light", "The wireless light"], "The internet light", "客户说 internet light is red。"),
      q("When will the engineer visit?", ["Thursday 12–2", "Thursday 2–4", "Friday 2–4"], "Thursday 2–4", "预约时段是 Thursday between two and four。"),
    ],
  },
  {
    id: "l26", skill: "listening", section: "Part 1", title: "家具配送改期", level: "基础", minutes: 15,
    focus: "订单号、日期、楼层与额外费用", audioFile: "l26.mp3", speakers: "Delivery agent + customer",
    text: "Agent: HomeStore deliveries. Customer: I need to change the delivery for order H S seven three six. It is currently booked for Monday the fourteenth. Agent: We can move it to Wednesday the sixteenth, between eight and noon. Customer: Good. The flat is on the fourth floor, and the lift is working. Agent: Fine. The driver will call thirty minutes before arrival. There is no charge for changing the date once, but another change would cost fifteen pounds.",
    questions: [
      q("What is the order number?", ["HS 367", "HS 736", "SH 736"], "HS 736", "订单号是 H S seven three six。"),
      q("What is the new delivery date?", ["Monday the 14th", "Wednesday the 16th", "Friday the 16th"], "Wednesday the 16th", "配送改到 Wednesday the sixteenth。"),
      q("Which floor is the flat on?", ["The third floor", "The fourth floor", "The fifth floor"], "The fourth floor", "客户说明 flat is on the fourth floor。"),
      q("How much does this date change cost?", ["Nothing", "£15", "£30"], "Nothing", "第一次改期不收费。"),
    ],
  },
  {
    id: "l27", skill: "listening", section: "Part 2", title: "员工餐厅调整说明", level: "进阶", minutes: 16,
    focus: "地点变化、支付方式、时段与反馈", audioFile: "l27.mp3", speakers: "Facilities manager",
    text: "From next Monday, the main staff restaurant will close for six weeks while the kitchen is replaced. A temporary canteen will operate in Meeting Hall B from seven thirty until two. Breakfast will be available until ten, and hot lunches from eleven thirty. The temporary site cannot accept cash, so use a staff card or bank card. Free drinking water is provided, but there will be no coffee machine. Please send comments through the facilities page rather than speaking to catering staff during busy periods.",
    questions: [
      q("How long will the main restaurant be closed?", ["4 weeks", "6 weeks", "8 weeks"], "6 weeks", "关闭时间是 six weeks。"),
      q("Where is the temporary canteen?", ["Meeting Hall B", "The staff kitchen", "Conference Room D"], "Meeting Hall B", "临时餐厅设在 Meeting Hall B。"),
      q("When do hot lunches begin?", ["10:00", "11:30", "12:00"], "11:30", "热午餐从 eleven thirty 开始。"),
      q("How should staff give feedback?", ["Through the facilities page", "To catering staff", "By placing a note in the canteen"], "Through the facilities page", "要求通过 facilities page 提交意见。"),
    ],
  },
  {
    id: "l28", skill: "listening", section: "Part 2", title: "成人游泳课入门说明", level: "进阶", minutes: 16,
    focus: "集合点、储物、装备与安全规则", audioFile: "l28.mp3", speakers: "Swimming instructor",
    text: "Welcome to the beginner swimming course. Meet your instructor beside Pool 2, not at the main reception. Changing-room lockers take a one-pound coin, which is returned when you reopen the locker. Bring a towel and swimming goggles, but floats are supplied by the centre. The first lesson includes a short water-safety check, so please tell the instructor about any medical condition before entering the pool. The lesson ends at eight forty-five, and the changing rooms close at nine fifteen.",
    questions: [
      q("Where should learners meet?", ["At main reception", "Beside Pool 2", "Inside the changing room"], "Beside Pool 2", "集合点是 Pool 2 旁边。"),
      q("What happens to the locker coin?", ["It is returned", "It pays for the lesson", "It is given to reception"], "It is returned", "重新打开柜门时硬币退回。"),
      q("What is provided by the centre?", ["Goggles", "Towels", "Floats"], "Floats", "浮板由中心提供，毛巾和泳镜自带。"),
      q("What should be reported before entering the pool?", ["A medical condition", "A late arrival", "A lost locker key"], "A medical condition", "入水前需告知任何 medical condition。"),
    ],
  },
  {
    id: "l29", skill: "listening", section: "Part 3", title: "社区历史展览策划", level: "进阶", minutes: 17,
    focus: "资料来源、采访许可、分工与截止日", audioFile: "l29.mp3", speakers: "Tutor + two students",
    text: "Tutor: What will your local history exhibition focus on? Ella: The old railway works. We found photographs in the town archive. Ben: I also want to interview former employees. Tutor: Good, but get written permission before recording anyone. Ella: I'll select six photographs and write the captions. Ben: I'll prepare the interview questions and contact the workers' association. Tutor: Bring your draft display plan next Tuesday. The final exhibition opens on the third of October, so all audio must be edited a week before that.",
    questions: [
      q("Where did the students find photographs?", ["In a newspaper office", "In the town archive", "At the railway station"], "In the town archive", "照片来自 town archive。"),
      q("What is required before an interview is recorded?", ["Written permission", "A payment", "A tutor's attendance"], "Written permission", "导师要求先取得 written permission。"),
      q("What will Ella do?", ["Contact former workers", "Select photographs and write captions", "Edit all audio"], "Select photographs and write captions", "Ella 的分工是选六张照片并写说明。"),
      q("When is the draft display plan due?", ["Next Tuesday", "One week before opening", "3 October"], "Next Tuesday", "导师要求 next Tuesday 带来草案。"),
    ],
  },
  {
    id: "l30", skill: "listening", section: "Part 3", title: "客户投诉数据分析", level: "进阶", minutes: 17,
    focus: "数据分类、抽样范围、图表选择与建议", audioFile: "l30.mp3", speakers: "Trainer + two employees",
    text: "Trainer: How are you analysing the complaint records? Sam: We grouped them into delivery, product quality and communication. Priya: Delivery is the largest group, but we only checked one month. Trainer: Use the last three months so the pattern is more reliable. Sam: We planned a pie chart. Trainer: A bar chart will make the categories easier to compare. Priya: Then we can examine the five most serious delivery cases and suggest changes. Trainer: Good. Send me the chart by Thursday morning and present your recommendations on Friday.",
    questions: [
      q("Which complaint category is currently the largest?", ["Communication", "Delivery", "Product quality"], "Delivery", "Priya 说 delivery is the largest group。"),
      q("How much data should the employees use?", ["One month", "Three months", "One year"], "Three months", "培训师要求使用 last three months。"),
      q("Which chart does the trainer recommend?", ["A bar chart", "A line graph", "A pie chart"], "A bar chart", "培训师认为 bar chart 更易比较。"),
      q("When will the recommendations be presented?", ["Thursday morning", "Thursday afternoon", "Friday"], "Friday", "图表周四交，建议周五展示。"),
    ],
  },
  {
    id: "l31", skill: "listening", section: "Part 4", title: "环境噪音与健康", level: "模考", minutes: 18,
    focus: "定义、研究发现、限制与干预措施", audioFile: "l31.mp3", speakers: "Public health lecturer",
    text: "Environmental noise is unwanted sound from sources such as roads, aircraft and construction. Its effect is not limited to hearing. Night-time noise can interrupt sleep even when a person does not fully wake up. One city study linked bedrooms facing busy roads with higher reports of tiredness, although the researchers could not remove every difference between households. Reducing speed limits can lower traffic noise, while trees alone usually provide little sound protection unless they form a very dense barrier. Building design, including quieter sides for bedrooms, may therefore be more effective.",
    questions: [
      q("Which source of environmental noise is mentioned?", ["Household music", "Road traffic", "Office conversations"], "Road traffic", "开头列出 roads、aircraft 和 construction。"),
      q("What can night-time noise do?", ["Interrupt sleep", "Improve concentration", "Prevent all dreaming"], "Interrupt sleep", "讲座指出夜间噪音会打断睡眠。"),
      q("What limitation affected the city study?", ["It studied only children", "It could not remove every household difference", "It measured no road noise"], "It could not remove every household difference", "研究无法排除家庭之间所有差异。"),
      q("Which measure may be most effective?", ["Planting a few trees", "Designing quieter bedroom sides", "Increasing road speed"], "Designing quieter bedroom sides", "结论更支持建筑设计中的安静朝向。"),
    ],
  },
  {
    id: "l32", skill: "listening", section: "Part 4", title: "家庭厨余收集试验", level: "模考", minutes: 18,
    focus: "试验设计、参与率、障碍与改进", audioFile: "l32.mp3", speakers: "Waste policy lecturer",
    text: "A twelve-week food-waste trial gave six hundred households a small kitchen container and a larger outdoor bin. Collections took place every Friday. By week four, about sixty-eight per cent of homes were using the service, but participation then stopped growing. Interviews showed that residents in flats had nowhere convenient to store the outdoor bin. Families also wanted clearer information about whether cooked food was accepted. The council responded with smaller shared bins for apartment buildings and a picture-based guide. In the final month, the average weight collected per participating home increased by fifteen per cent.",
    questions: [
      q("How long did the trial last?", ["6 weeks", "12 weeks", "15 weeks"], "12 weeks", "试验持续 twelve weeks。"),
      q("On which day was food waste collected?", ["Wednesday", "Friday", "Saturday"], "Friday", "收集日是 every Friday。"),
      q("What problem did flat residents report?", ["No suitable bin storage", "Collections were too early", "The kitchen container was too large"], "No suitable bin storage", "公寓住户缺少存放室外桶的方便空间。"),
      q("What changed in the final month?", ["Participation fell by 15%", "Collected weight per home rose by 15%", "The trial added 15 buildings"], "Collected weight per home rose by 15%", "最后一个月每户平均收集重量提高 15%。"),
    ],
  },
];

export const readingBatch03: CourseLesson[] = [
  {
    id: "r25", skill: "reading", section: "Section 1", title: "铁路替代公交通知", level: "基础", minutes: 16,
    focus: "日期、站点、行李与无障碍安排",
    text: "RAIL REPLACEMENT BUSES\nOn Sunday 18 August, trains between Harford and Milton will be replaced by buses from 7 a.m. until 4 p.m. Buses leave from the east side of Harford Station, outside Stop E. Journey times may be up to 35 minutes longer. Standard rail tickets remain valid. Bicycles cannot be carried, but folded pushchairs and normal luggage are accepted. Passengers who need a wheelchair space should contact the assistance team by 6 p.m. on Friday.",
    questions: [
      q("When does the replacement service end?", ["4 p.m.", "6 p.m.", "7 p.m."], "4 p.m.", "替代服务运行到下午四点。"),
      q("Where do buses leave Harford Station?", ["Stop E on the east side", "Stop B on the west side", "The main taxi rank"], "Stop E on the east side", "通知给出 east side 的 Stop E。"),
      q("Which item cannot be carried?", ["Normal luggage", "A bicycle", "A folded pushchair"], "A bicycle", "自行车不能上替代公交。"),
      q("When is the deadline for wheelchair assistance?", ["Friday 6 p.m.", "Sunday 7 a.m.", "Sunday 4 p.m."], "Friday 6 p.m.", "需在周五下午六点前联系。"),
    ],
  },
  {
    id: "r26", skill: "reading", section: "Section 1", title: "居民停车许可证", level: "基础", minutes: 16,
    focus: "资格、材料、访客证与处理时间",
    text: "RESIDENT PARKING PERMITS\nPeople whose main home is inside Zone C may apply online. Upload proof of address dated within the last three months and the vehicle registration document. A twelve-month permit costs £85. Households without their own permit may buy up to 30 one-day visitor permits each year. Applications are normally processed within five working days. A permit does not guarantee a space and is not valid in loading bays between 8 a.m. and 6 p.m.",
    questions: [
      q("Who may apply?", ["Anyone working in Zone C", "A person whose main home is in Zone C", "Any visitor with a car"], "A person whose main home is in Zone C", "资格取决于主要住所位于 Zone C。"),
      q("How much is a twelve-month permit?", ["£30", "£58", "£85"], "£85", "年证费用是 £85。"),
      q("How many visitor permits may an eligible household buy?", ["5", "12", "30"], "30", "每年最多三十张一日访客证。"),
      q("A permit guarantees that a parking space will be available.", ["True", "False", "Not Given"], "False", "通知明确说 permit does not guarantee a space。"),
    ],
  },
  {
    id: "r27", skill: "reading", section: "Section 1", title: "河畔社区节日程", level: "基础", minutes: 16,
    focus: "活动时间、年龄限制、报名与天气变化",
    text: "RIVERSIDE DAY\n10:00 Community run — registration closes at 9:40.\n11:30 Children's cooking — ages 8–12; book online.\n13:00 Local history walk — meet at the clock tower; about 75 minutes.\n15:00 Outdoor theatre — free, no booking required.\nThe craft market runs from 10:00 to 16:30. If there is heavy rain, the cooking session and theatre move to the school hall, but the history walk is cancelled. Refunds for paid activities are issued automatically.",
    questions: [
      q("When does registration for the run close?", ["9:40", "10:00", "10:40"], "9:40", "跑步报名九点四十分截止。"),
      q("Who may join the cooking session?", ["Children aged 5–7", "Children aged 8–12", "All ages without booking"], "Children aged 8–12", "活动限制为 ages 8–12。"),
      q("Where does the history walk begin?", ["At the school hall", "At the craft market", "At the clock tower"], "At the clock tower", "集合点是 clock tower。"),
      q("What happens to the history walk in heavy rain?", ["It moves indoors", "It starts later", "It is cancelled"], "It is cancelled", "大雨时历史步行取消。"),
    ],
  },
  {
    id: "r28", skill: "reading", section: "Section 2", title: "独立作业安全政策", level: "进阶", minutes: 18,
    focus: "风险评估、联络程序与禁止事项",
    text: "LONE WORKING POLICY\nBefore an employee works alone, the manager must record the hazards and agree a contact schedule. The employee checks in by text at the start and end of the visit. For work lasting more than three hours, an additional check is required halfway through. If a check-in is 20 minutes late, the supervisor first calls the employee and then follows the emergency contact plan. Lone workers must not enter a property where violence has previously been reported, and they may not use ladders above two metres without another trained person present.",
    questions: [
      q("Who records the hazards?", ["The employee", "The manager", "The emergency contact"], "The manager", "风险记录责任属于 manager。"),
      q("When is an extra check required?", ["For work over three hours", "For every home visit", "Only after a late message"], "For work over three hours", "超过三小时需中途额外联系。"),
      q("What happens first after a check-in is 20 minutes late?", ["Police are called", "The supervisor calls the employee", "The visit is cancelled"], "The supervisor calls the employee", "第一步是主管打电话给员工。"),
      q("A lone worker may use a three-metre ladder if the manager knows.", ["True", "False", "Not Given"], "False", "两米以上梯子必须有另一名受训人员在场。"),
    ],
  },
  {
    id: "r29", skill: "reading", section: "Section 2", title: "员工费用报销规则", level: "进阶", minutes: 18,
    focus: "可报项目、凭证、时限与审批",
    text: "STAFF EXPENSES\nEmployees should use the cheapest reasonable travel option. Rail fares are reimbursed at standard-class rates; first class requires written approval before booking. Meals may be claimed only when work requires an overnight stay, up to £25 for an evening meal. Original digital or paper receipts must be attached. Claims should be submitted within 30 days of the expense. The employee's manager checks the business purpose, while Finance checks receipts and payment limits. Missing receipts require a signed explanation but may still be refused.",
    questions: [
      q("When is first-class rail travel allowed?", ["For any long journey", "With advance written approval", "When standard class is full"], "With advance written approval", "头等座需订票前书面批准。"),
      q("When may an evening meal be claimed?", ["During any late shift", "When work requires an overnight stay", "When a meeting lasts over two hours"], "When work requires an overnight stay", "只有因工作过夜时可以报晚餐。"),
      q("What is the normal claim deadline?", ["14 days", "30 days", "60 days"], "30 days", "费用发生后三十天内提交。"),
      q("Who checks the business purpose?", ["The employee's manager", "Finance", "The travel provider"], "The employee's manager", "经理核查业务目的，财务核查凭证与限额。"),
    ],
  },
  {
    id: "r30", skill: "reading", section: "Section 2", title: "急救复训要求", level: "进阶", minutes: 18,
    focus: "证书期限、适用员工与报名程序",
    text: "FIRST-AID REFRESHER\nWorkplace first-aid certificates last three years, but the company requires a half-day refresher every year. Staff responsible for a public reception area or a workshop must attend. Office employees may join if places remain. This year's sessions are on 6 and 21 November in Training Room 3. Book through the learning portal after receiving your manager's approval. Anyone whose full certificate expires within the next two months should enrol on the two-day renewal course instead.",
    questions: [
      q("How often does the company require a refresher?", ["Every six months", "Every year", "Every three years"], "Every year", "证书三年，但公司要求每年复训。"),
      q("Who must attend?", ["All office employees", "Staff in public reception or workshops", "Only new managers"], "Staff in public reception or workshops", "指定公共接待区或车间负责人必须参加。"),
      q("Where are the sessions held?", ["Training Room 3", "Workshop 6", "Reception Room 21"], "Training Room 3", "地点是 Training Room 3。"),
      q("Who should take the two-day course instead?", ["Staff with certificates expiring soon", "Staff without manager approval", "Office staff joining voluntarily"], "Staff with certificates expiring soon", "两个月内到期者应报两日续证课。"),
    ],
  },
  {
    id: "r31", skill: "reading", section: "Section 3", title: "共享办公空间的发展", level: "模考", minutes: 22,
    focus: "发展原因、用户差异、管理挑战与结论",
    text: "Shared workspaces first attracted freelancers who wanted a desk without the cost of a permanent office. Their appeal later widened to small companies and remote employees whose homes were unsuitable for full-time work. A membership may include a desk, meeting rooms and internet access, but the less visible attraction is social: people working alone can exchange advice or simply have a reason to leave home.\n\nThe model is not equally useful for everyone. Phone calls and informal conversations may distract workers handling detailed tasks. Companies dealing with private client information must consider who can see screens or hear discussions. Some operators respond with quiet zones, bookable booths and stricter rules for shared tables.\n\nLocation also shapes success. A fashionable building is of limited value if members need a long, expensive journey to reach it. Workspaces near suburban transport hubs may reduce travel to city centres while still separating work from home. The strongest providers therefore sell more than attractive furniture: they manage different kinds of space and understand the working patterns of the people around them.",
    questions: [
      q("Who were the earliest main users of shared workspaces?", ["Large companies", "Freelancers", "Tourists"], "Freelancers", "首句指出最初吸引 freelancers。"),
      q("What social benefit is mentioned?", ["Guaranteed new clients", "Advice and contact with other people", "Free professional training"], "Advice and contact with other people", "共享空间提供交流建议和离开家的理由。"),
      q("What problem affects companies with private information?", ["Furniture costs", "Screen and conversation privacy", "Lack of city-centre shops"], "Screen and conversation privacy", "第二段强调屏幕和谈话可能被看见或听见。"),
      q("What does the writer say strong providers understand?", ["Only interior design", "Local working patterns and different space needs", "How to make every member commute farther"], "Local working patterns and different space needs", "结尾强调空间类型管理与周边人群工作模式。"),
    ],
  },
  {
    id: "r32", skill: "reading", section: "Section 3", title: "城市街市为何仍然重要", level: "模考", minutes: 22,
    focus: "历史变化、经济作用、冲突与适应策略",
    text: "Street markets have survived repeated predictions that supermarkets and online shopping would make them unnecessary. Their continuing role is partly economic. New traders can test a product with lower costs than opening a permanent shop, while customers can compare goods from several small sellers in one place. Markets also bring activity to town centres on days when other businesses may be quiet.\n\nSurvival, however, requires adaptation. Traders need card payment as well as cash, and clear online information about opening times helps visitors plan a journey. Councils must balance the market's benefits with complaints about waste, delivery vehicles and early-morning noise. Moving a market to an isolated site may solve those problems but remove the passing customers on which traders depend.\n\nSome successful markets now mix traditional food stalls with repair services, local crafts and occasional evening events. This does not mean every market should become entertainment. Rather, managers need to understand why people visit and protect the features that ordinary shops cannot easily copy: direct contact with sellers, changing stock and a strong connection to place.",
    questions: [
      q("How do markets help new traders?", ["They guarantee high profits", "They allow lower-cost product testing", "They provide permanent shops"], "They allow lower-cost product testing", "首段说明可用较低成本测试产品。"),
      q("Why is online information useful?", ["It replaces card payment", "It helps visitors plan", "It prevents all noise complaints"], "It helps visitors plan", "明确说明开放时间信息帮助规划行程。"),
      q("What risk comes with moving a market away?", ["Traders may lose passing customers", "Waste collection becomes impossible", "All products become more expensive"], "Traders may lose passing customers", "偏远地点会失去路过顾客。"),
      q("What feature does the writer believe markets should protect?", ["Identical stock every week", "Direct contact with sellers", "Entertainment at every session"], "Direct contact with sellers", "结尾列出难以复制的直接卖家接触等特征。"),
    ],
  },
];

const task1Checklist = ["开头直接说明写信目的", "三个任务点都有具体细节", "语气符合正式或私人关系", "至少 150 词并检查时态、拼写和分段"];
const task2Checklist = ["引言回应题目并表明立场", "主体段有中心句、解释和例子", "让步和因果关系清楚", "至少 250 词且结论不加入新观点"];

export const writingBatch03: CourseLesson[] = [
  { id: "w25", skill: "writing", section: "Task 1 · 正式信", title: "请求房东允许养宠物", level: "进阶", minutes: 26, focus: "背景、责任承诺与具体请求", task: "You rent a home where pets are normally not allowed, but you would like to keep a small pet. Write a letter to your landlord. Write at least 150 words.", bullets: ["describe the pet you would like to keep", "explain why your circumstances have changed", "say how you will prevent damage or disturbance"], checklist: task1Checklist },
  { id: "w26", skill: "writing", section: "Task 1 · 私人信", title: "为错过朋友的重要活动道歉", level: "进阶", minutes: 26, focus: "真诚道歉、原因和补偿安排", task: "You missed an important event organised by a friend. Write a letter to your friend. Write at least 150 words.", bullets: ["apologise for not attending", "explain what prevented you from going", "suggest how you can celebrate or meet soon"], checklist: task1Checklist },
  { id: "w27", skill: "writing", section: "Task 1 · 正式信", title: "要求更正账单记录", level: "进阶", minutes: 26, focus: "证据、错误影响与解决时限", task: "A service company has charged you for something you did not receive. Write a letter to the accounts department. Write at least 150 words.", bullets: ["give the account and bill details", "explain why the charge is incorrect", "request a correction and confirmation"], checklist: task1Checklist },
  { id: "w28", skill: "writing", section: "Task 1 · 私人信", title: "邀请朋友参加社区课程", level: "进阶", minutes: 26, focus: "活动介绍、适合原因与实际安排", task: "You have found a local course that you think a friend would enjoy. Write a letter to your friend. Write at least 150 words.", bullets: ["describe the course and timetable", "explain why it would suit your friend", "suggest how you could attend together"], checklist: task1Checklist },
  { id: "w29", skill: "writing", section: "Task 2 · 双边讨论", title: "社区公共空间还是更多住房", level: "模考", minutes: 42, focus: "比较公共利益并给出平衡立场", task: "Some people think unused urban land should be used for housing, while others believe it should become public open space. Discuss both views and give your own opinion. Write at least 250 words.", bullets: ["explain the need for additional housing", "explain the value of public open space", "give a clear view about how cities should decide"], checklist: task2Checklist },
  { id: "w30", skill: "writing", section: "Task 2 · 优缺点", title: "长期远程办公", level: "模考", minutes: 42, focus: "区分个人、企业和长期影响", task: "More employees are working from home for most or all of the week. What are the advantages and disadvantages of this development? Write at least 250 words.", bullets: ["explain benefits for workers or employers", "explain practical or social disadvantages", "use examples from different kinds of work"], checklist: task2Checklist },
  { id: "w31", skill: "writing", section: "Task 2 · 问题与对策", title: "老龄人口与社区服务", level: "模考", minutes: 42, focus: "建立问题因果链并评估方案", task: "In many places, the proportion of older people is increasing. What challenges can this create for local communities, and what measures could help? Write at least 250 words.", bullets: ["identify pressures on services or families", "explain social effects such as isolation", "evaluate practical community and government measures"], checklist: task2Checklist },
  { id: "w32", skill: "writing", section: "Task 2 · 观点", title: "面向儿童的商业广告", level: "模考", minutes: 42, focus: "限定同意程度并处理反方论点", task: "Advertising aimed at children should be strictly controlled. To what extent do you agree or disagree? Write at least 250 words.", bullets: ["state the extent of your agreement", "explain possible effects on children and families", "consider whether regulation or parental guidance is more effective"], checklist: task2Checklist },
];

export const speakingBatch03: CourseLesson[] = [
  { id: "s25", skill: "speaking", section: "Part 1", title: "照片", level: "进阶", minutes: 10, focus: "习惯、具体照片、过去变化与偏好", prompts: ["Do you often take photographs?", "What kind of photographs do you keep?", "Did you take more photographs when you were younger?", "Do you prefer looking at photographs on paper or on a screen?"], keywords: ["often", "because", "used to", "prefer"] },
  { id: "s26", skill: "speaking", section: "Part 1", title: "公园与户外空间", level: "进阶", minutes: 10, focus: "地点描述、活动和改进建议", prompts: ["Is there a park near your home?", "What do people usually do there?", "How often do you use outdoor public spaces?", "What would make local parks better?"], keywords: ["near", "usually", "often", "would"] },
  { id: "s27", skill: "speaking", section: "Part 1", title: "新闻与阅读", level: "进阶", minutes: 10, focus: "来源、频率、可信度和未来习惯", prompts: ["How do you usually get news?", "What kinds of stories interest you?", "How do you decide whether information is reliable?", "Do you think your news habits will change?"], keywords: ["usually", "interested", "reliable", "future"] },
  { id: "s28", skill: "speaking", section: "Part 2", title: "学会一项实用技能", level: "进阶", minutes: 14, focus: "过程、困难、帮助与结果", task: "Describe a practical skill that you learned successfully.", bullets: ["what the skill was", "why you needed it", "how you learned it", "how it has helped you"], prompts: ["You have one minute to prepare. Then speak for up to two minutes."], keywords: ["needed", "at first", "practised", "now"] },
  { id: "s29", skill: "speaking", section: "Part 2", title: "想居住的地方", level: "进阶", minutes: 14, focus: "空间、设施、生活方式与理由", task: "Describe a place where you would like to live for a period of time.", bullets: ["where the place is", "what the area is like", "what you would do there", "why you would like to live there"], prompts: ["You have one minute to prepare. Then speak for up to two minutes."], keywords: ["located", "would", "facilities", "because"] },
  { id: "s30", skill: "speaking", section: "Part 2", title: "需要遵守的规则", level: "进阶", minutes: 14, focus: "规则来源、目的、行为与评价", task: "Describe a rule that you need to follow at work, in education or in daily life.", bullets: ["what the rule is", "where it applies", "why it exists", "how you feel about it"], prompts: ["You have one minute to prepare. Then speak for up to two minutes."], keywords: ["required", "prevents", "although", "reasonable"] },
  { id: "s31", skill: "speaking", section: "Part 3", title: "城市公共空间", level: "模考", minutes: 16, focus: "比较需求、资金责任与长期变化", prompts: ["Why are public spaces important in cities?", "Should housing ever replace parks or community facilities?", "Who should pay for maintaining public spaces?", "How might public spaces change in the future?"], keywords: ["one benefit", "whereas", "responsible", "might"] },
  { id: "s32", skill: "speaking", section: "Part 3", title: "广告与消费选择", level: "模考", minutes: 16, focus: "分析影响、举例、让步和监管", prompts: ["How does advertising influence everyday choices?", "Are online reviews more useful than advertisements?", "Should advertising to children be restricted?", "Will people become less influenced by advertising in the future?"], keywords: ["for example", "however", "should", "depends"] },
];

export const curriculumBatch03: CourseLesson[] = [
  ...listeningBatch03,
  ...readingBatch03,
  ...writingBatch03,
  ...speakingBatch03,
];
