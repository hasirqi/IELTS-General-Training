import type { ChoiceQuestion, CourseLesson } from "./curriculum-v2";

const q = (prompt: string, options: string[], answer: string, explanation: string): ChoiceQuestion => ({ prompt, options, answer, explanation });

export const listeningBatch05: CourseLesson[] = [
  {
    id: "l41", skill: "listening", section: "Part 1", title: "预约自行车维修", level: "基础", minutes: 15,
    focus: "车型、故障、送修时间与估价", audioFile: "l41.mp3", speakers: "Bike-shop assistant + customer",
    text: "Assistant: Green Wheel Repairs. Customer: My city bike needs a service because the rear brake is making a loud noise. Assistant: Is it an electric bike? Customer: No, it is a standard blue Ridgeway model. Assistant: Bring it on Monday after ten. We can inspect it by noon and text you before replacing any parts. A basic service is forty-five pounds. New brake pads would add eighteen pounds. Customer: Fine. My mobile number ends in seven four two nine. Assistant: Your booking reference is B R five six.",
    questions: [
      q("What problem does the bicycle have?", ["A noisy rear brake", "A flat front tyre", "A broken electric motor"], "A noisy rear brake", "客户说 rear brake 发出很大噪音。"),
      q("What type of bicycle is it?", ["An electric bike", "A standard city bike", "A racing bike"], "A standard city bike", "客户否认电动款，说明是 standard Ridgeway city bike。"),
      q("When should the customer bring it in?", ["Monday after 10", "Monday before 9", "Tuesday at noon"], "Monday after 10", "店员要求 Monday after ten 送来。"),
      q("How much would new brake pads add?", ["£18", "£45", "£63"], "£18", "基础保养 45 镑，刹车片额外 18 镑。"),
    ],
  },
  {
    id: "l42", skill: "listening", section: "Part 1", title: "报名语言交流活动", level: "基础", minutes: 15,
    focus: "语言、水平、场次与携带物品", audioFile: "l42.mp3", speakers: "Event organiser + participant",
    text: "Organiser: City Language Exchange. Participant: I'd like to join the Japanese and English table. Organiser: Is your Japanese beginner or intermediate? Participant: Intermediate. I lived in Osaka for a year. Organiser: The Thursday session is full, but there are places on Saturday from two thirty to four in Room seven. Participant: That works. Organiser: The fee is six pounds, including tea. Bring a notebook, but dictionaries are provided. Please wear the green name label so partners know you want equal time in both languages.",
    questions: [
      q("Which language table does the participant want?", ["Japanese and English", "Chinese and English", "Japanese and Chinese"], "Japanese and English", "参与者明确选择 Japanese and English table。"),
      q("What is the participant's Japanese level?", ["Beginner", "Intermediate", "Advanced"], "Intermediate", "参与者说 Intermediate。"),
      q("When will the participant attend?", ["Thursday 2:30–4", "Saturday 2:30–4", "Saturday 4–6"], "Saturday 2:30–4", "周四已满，报名周六两点半至四点。"),
      q("What should the participant bring?", ["A dictionary", "A notebook", "Tea"], "A notebook", "字典和茶由活动提供，只需带 notebook。"),
    ],
  },
  {
    id: "l43", skill: "listening", section: "Part 2", title: "周末食品市场摊主说明", level: "进阶", minutes: 16,
    focus: "入场、摊位、用电、垃圾与离场", audioFile: "l43.mp3", speakers: "Market coordinator",
    text: "Stallholders may enter the market site through Gate North from six thirty on Saturday. Vehicles must leave the selling area by eight fifteen and park in Field two. Your numbered table is provided, but bring your own weatherproof cover. Electricity is available only to traders who booked it in advance; extension cables must be covered by safety mats. Separate food waste from cardboard and cooking oil. The public market closes at two, although stalls must remain in place until two fifteen for safety. Before leaving, have your area checked by the coordinator in an orange jacket.",
    questions: [
      q("When can stallholders enter the site?", ["6:30", "8:15", "9:00"], "6:30", "摊主可从早上六点半进场。"),
      q("Where should vehicles be parked?", ["Beside Gate North", "In Field 2", "Behind each stall"], "In Field 2", "车辆八点十五前离开售卖区并停到 Field two。"),
      q("Who may use electricity?", ["All food traders", "Only advance bookings", "Only indoor stalls"], "Only advance bookings", "只有提前预订电力的商户可以使用。"),
      q("What is required before leaving?", ["A coordinator's area check", "A new table number", "A public announcement"], "A coordinator's area check", "离场前需让穿橙色外套的协调员检查区域。"),
    ],
  },
  {
    id: "l44", skill: "listening", section: "Part 2", title: "公寓搬入流程说明", level: "进阶", minutes: 16,
    focus: "预约、入口、电梯保护与钥匙归还", audioFile: "l44.mp3", speakers: "Building manager",
    text: "Residents moving into Brook House must reserve a two-hour arrival period at least three working days ahead. Use the service entrance on Mason Street, not the glass doors in the courtyard. The large lift will be protected with wall covers, but it cannot carry items longer than two point two metres. Do not leave boxes in corridors or hold fire doors open. Collect the temporary lift key from reception with a fifty-pound refundable deposit. Return it by six that evening; late return means the deposit is kept. Weekend moves are allowed only on Saturday mornings.",
    questions: [
      q("How far ahead must a moving period be reserved?", ["One day", "Three working days", "One week"], "Three working days", "搬入时段至少提前三个工作日预约。"),
      q("Which entrance should residents use?", ["The Mason Street service entrance", "The courtyard glass doors", "The underground car park"], "The Mason Street service entrance", "要求使用 Mason Street 的 service entrance。"),
      q("What is the maximum item length for the lift?", ["1.2 metres", "2.0 metres", "2.2 metres"], "2.2 metres", "电梯不能搬运超过 two point two metres 的物品。"),
      q("When are weekend moves permitted?", ["Saturday mornings", "Saturday afternoons", "Sunday mornings"], "Saturday mornings", "周末只允许 Saturday mornings。"),
    ],
  },
  {
    id: "l45", skill: "listening", section: "Part 3", title: "员工健康问卷研究", level: "进阶", minutes: 17,
    focus: "匿名性、抽样、变量与展示方式", audioFile: "l45.mp3", speakers: "Supervisor + two trainees",
    text: "Supervisor: How will you evaluate the staff wellbeing programme? Ava: We could ask managers to name employees whose stress improved. Supervisor: That would not be anonymous. Leo: We'll send a private survey link instead. Ava: Should we contact only people who attended every workshop? Supervisor: Include attendees and a comparison group who did not join. Record department and working pattern, but not exact job title because some teams are very small. Leo: We'll compare sleep quality and sick days before and after the programme. Supervisor: Good. Use two bar charts and explain that the survey shows association, not proof of cause.",
    questions: [
      q("Why was the managers' list rejected?", ["It would cost too much", "It would not be anonymous", "It included no departments"], "It would not be anonymous", "由经理点名员工会破坏匿名性。"),
      q("Who should be included in the study?", ["Workshop attendees only", "Managers only", "Attendees and a comparison group"], "Attendees and a comparison group", "需同时纳入参加者和未参加的对照组。"),
      q("Which detail should not be recorded?", ["Department", "Working pattern", "Exact job title"], "Exact job title", "小团队中具体职位可能暴露身份，因此不记录。"),
      q("What limitation must the trainees explain?", ["The survey cannot prove cause", "There are no sick-day records", "Bar charts cannot show change"], "The survey cannot prove cause", "导师要求说明只能显示关联，不能证明因果。"),
    ],
  },
  {
    id: "l46", skill: "listening", section: "Part 3", title: "河岸清理项目评估", level: "进阶", minutes: 17,
    focus: "分类记录、抽样位置、志愿者分工与报告", audioFile: "l46.mp3", speakers: "Tutor + two students",
    text: "Tutor: How will you measure the river clean-up? Nina: We planned to weigh all the rubbish together. Joel: But then we cannot tell which type is most common. Tutor: Sort it into plastic, metal, glass and other waste. Sample three hundred metres upstream and the same distance downstream from the picnic area. Nina: I'll photograph each section before and after. Joel: I'll record the weights and interview ten volunteers. Tutor: Ask volunteers what was difficult, not whether the event was successful. Submit the data table on Tuesday and your recommendations the following Friday.",
    questions: [
      q("Why should the rubbish not be weighed together?", ["The scales are too small", "Waste types could not be compared", "Volunteers cannot carry it"], "Waste types could not be compared", "混在一起称重无法判断哪类垃圾最多。"),
      q("How much river should be sampled in each direction?", ["100 metres", "300 metres", "600 metres"], "300 metres", "野餐区上下游各抽样三百米。"),
      q("What will Nina do?", ["Interview volunteers", "Record all weights", "Photograph each section"], "Photograph each section", "Nina 负责清理前后拍摄各河段。"),
      q("When are the recommendations due?", ["Tuesday", "The following Friday", "The same Friday"], "The following Friday", "数据表周二交，建议在之后的周五交。"),
    ],
  },
  {
    id: "l47", skill: "listening", section: "Part 4", title: "社区花园的社会作用", level: "模考", minutes: 18,
    focus: "参与收益、进入障碍、研究证据与设计", audioFile: "l47.mp3", speakers: "Community health lecturer",
    text: "Community gardens are shared spaces where residents grow food or flowers. Their value is not limited to fresh produce. Regular sessions can create social contact and provide gentle physical activity. However, benefits depend on access: fixed weekday times may exclude shift workers, while raised beds and firm paths are needed by some older or disabled gardeners. Research often finds better self-reported wellbeing among participants, but volunteers may already be more socially active than non-participants. Strong projects therefore track who stops attending and offer small plots, shared tools and beginner guidance rather than assuming everyone arrives with experience.",
    questions: [
      q("Which benefit is mentioned besides fresh food?", ["Guaranteed employment", "Social contact", "Free housing"], "Social contact", "讲座强调社交接触和轻度身体活动。"),
      q("Who may be excluded by fixed weekday sessions?", ["Shift workers", "Experienced gardeners", "Local shop owners"], "Shift workers", "固定工作日时间会排除轮班工作者。"),
      q("What limits the wellbeing evidence?", ["Gardens grow no food", "Participants may already be socially active", "Researchers measured only paths"], "Participants may already be socially active", "参与者原本可能就更活跃，因此不能简单归因。"),
      q("What support should beginner gardeners receive?", ["Larger private gardens", "Tools and guidance", "Paid full-time work"], "Tools and guidance", "强项目提供共享工具和入门指导。"),
    ],
  },
  {
    id: "l48", skill: "listening", section: "Part 4", title: "共享电动自行车研究", level: "模考", minutes: 18,
    focus: "使用人群、替代交通、停放与公平性", audioFile: "l48.mp3", speakers: "Transport researcher",
    text: "Electric bike-share schemes can make longer or hilly journeys practical for people who would not use a standard bicycle. Registration data may show rapid growth, but it does not reveal which transport mode is replaced. If most journeys replace walking or buses rather than cars, the environmental gain is smaller than expected. Poorly parked bikes can block pavements, so marked bays and quick removal systems are important. Pricing also affects fairness: a low single-ride fee helps occasional users, while smartphone-only access excludes others. Researchers recommend cash payment points and analysing use by neighbourhood, not just total trip numbers.",
    questions: [
      q("Who may particularly benefit from electric bikes?", ["People making hilly journeys", "Only professional cyclists", "People travelling by aircraft"], "People making hilly journeys", "电助力让较长或有坡度的路程更可行。"),
      q("Why can registration growth be misleading?", ["It records no bicycle colour", "It does not show which travel mode was replaced", "It excludes every regular user"], "It does not show which travel mode was replaced", "注册数据无法说明共享单车替代了汽车、步行还是公交。"),
      q("What problem can marked parking bays reduce?", ["Blocked pavements", "High battery prices", "Long registration forms"], "Blocked pavements", "划定停车区可减少车辆阻塞人行道。"),
      q("What access change is recommended?", ["Higher annual fees", "Cash payment points", "Removing single rides"], "Cash payment points", "为避免只用手机造成排除，建议提供现金支付点。"),
    ],
  },
];

export const readingBatch05: CourseLesson[] = [
  {
    id: "r41", skill: "reading", section: "Section 1", title: "机场接驳车预订须知", level: "基础", minutes: 16,
    focus: "班次、行李、儿童票与航班延误",
    text: "AIRPORT SHUTTLE\nShuttles leave Central Square every hour from 05:30 to 21:30. Book by midnight the day before travel; seats cannot be purchased from the driver. One large suitcase and one cabin bag are included. Additional luggage costs £6 and must be declared when booking. Children under five travel free but still need a reserved seat. For airport pickups, enter the flight number. If the flight is delayed, the booking moves automatically to the next available shuttle without an extra charge.",
    questions: [
      q("When does the first shuttle leave Central Square?", ["05:30", "06:00", "21:30"], "05:30", "首班车时间为 05:30。"),
      q("Where can passengers buy a seat?", ["From the driver", "Through advance booking", "At the airport only"], "Through advance booking", "需前一晚午夜前预订，司机不售票。"),
      q("How much does an additional bag cost?", ["£5", "£6", "£12"], "£6", "额外行李收费六英镑。"),
      q("What happens after a flight delay?", ["The booking is cancelled", "A new full fare is charged", "The booking moves to the next available shuttle"], "The booking moves to the next available shuttle", "输入航班号后，延误会自动转到下一班可用车辆。"),
    ],
  },
  {
    id: "r42", skill: "reading", section: "Section 1", title: "药房送药服务说明", level: "基础", minutes: 16,
    focus: "适用范围、预约、冷藏药物与无人签收",
    text: "PHARMACY HOME DELIVERY\nFree weekday delivery is available to patients living within four kilometres of Park Pharmacy. Order repeat medicines at least three working days before they run out. Deliveries take place between 2 p.m. and 6 p.m.; an exact time cannot be promised. Refrigerated medicine must be handed directly to an adult and cannot be left with a neighbour. For other items, nominate a safe place when ordering. If nobody receives a signed delivery, the driver returns it to the pharmacy for collection the next day.",
    questions: [
      q("Who qualifies for free weekday delivery?", ["All city residents", "Patients within four kilometres", "Only hospital staff"], "Patients within four kilometres", "免费范围是药房四公里以内。"),
      q("How early should repeat medicine be ordered?", ["One day", "Three working days", "One week"], "Three working days", "至少在用完前三个工作日订购。"),
      q("What is required for refrigerated medicine?", ["A safe outdoor place", "Direct handover to an adult", "Delivery to a neighbour"], "Direct handover to an adult", "冷藏药必须直接交给成年人。"),
      q("Where does an unsuccessful signed delivery go?", ["To a neighbour", "Back to the pharmacy", "To the hospital"], "Back to the pharmacy", "无人签收时司机将物品退回药房。"),
    ],
  },
  {
    id: "r43", skill: "reading", section: "Section 1", title: "社区活动室租用规则", level: "基础", minutes: 16,
    focus: "押金、布置、餐饮与取消",
    text: "COMMUNITY ROOM HIRE\nRoom A holds 30 people and Room B holds 55. A refundable £80 deposit is required for either room. Hirers may enter 45 minutes before the booked start time to arrange furniture. Decorations must use the removable hooks provided; tape and pins are prohibited. Cold food may be brought in, but hot-food suppliers must provide an insurance certificate. Cancel at least seven days ahead for a full fee refund. The deposit is returned after staff check the room for damage and cleaning.",
    questions: [
      q("What is the deposit for Room B?", ["£45", "£55", "£80"], "£80", "两间活动室押金都是八十英镑。"),
      q("How early may hirers enter?", ["30 minutes", "45 minutes", "55 minutes"], "45 minutes", "可提前四十五分钟进入布置。"),
      q("How should decorations be attached?", ["With removable hooks", "With tape", "With pins"], "With removable hooks", "只能使用提供的可移除挂钩。"),
      q("What is needed from a hot-food supplier?", ["A room key", "An insurance certificate", "A larger deposit"], "An insurance certificate", "热食供应商必须提供保险证明。"),
    ],
  },
  {
    id: "r44", skill: "reading", section: "Section 2", title: "远程办公信息安全", level: "进阶", minutes: 18,
    focus: "网络、屏幕、文件与事故报告",
    text: "SECURE REMOTE WORKING\nUse the company virtual private network whenever accessing internal systems outside the office. Public Wi-Fi may be used only through this connection; personal phone hotspots are preferred. Position screens where household members and visitors cannot read them, and lock the computer whenever you leave the room. Do not print confidential documents at home unless a manager has approved a secure storage and disposal method. Company files must remain in approved cloud folders, not on personal drives. Report a lost device or accidental disclosure immediately through the security hotline.",
    questions: [
      q("When is the company network connection required?", ["Only in the office", "When accessing internal systems remotely", "Only for video meetings"], "When accessing internal systems remotely", "办公室外访问内部系统必须使用公司虚拟专网。"),
      q("Which internet connection is preferred?", ["Open public Wi-Fi", "A personal phone hotspot", "A neighbour's router"], "A personal phone hotspot", "规定明确更推荐 personal phone hotspot。"),
      q("When may confidential documents be printed at home?", ["After manager approval of secure handling", "Whenever paper is available", "Only at weekends"], "After manager approval of secure handling", "需经理批准安全储存和销毁方案。"),
      q("Where should company files be stored?", ["On personal drives", "In approved cloud folders", "In private email"], "In approved cloud folders", "公司文件必须保存在批准的云文件夹。"),
    ],
  },
  {
    id: "r45", skill: "reading", section: "Section 2", title: "员工导师计划", level: "进阶", minutes: 18,
    focus: "资格、匹配、会议与保密边界",
    text: "STAFF MENTORING PROGRAMME\nEmployees who have completed six months' service may request a mentor outside their direct reporting line. The programme team matches participants by development goal rather than job title. Mentors and mentees should meet once a month for six months and agree a short agenda beforehand. Discussions are private, but mentors must report concerns involving safety, unlawful conduct or serious risk to wellbeing. Mentors offer questions, experience and contacts; they do not approve leave, conduct performance reviews or promise promotion. Either participant may request a new match through Human Resources.",
    questions: [
      q("When may an employee request a mentor?", ["On the first day", "After six months' service", "After a promotion"], "After six months' service", "完成六个月任职后才可申请。"),
      q("How are participants matched?", ["By development goal", "By identical job title", "By age"], "By development goal", "匹配依据是发展目标而非职位名称。"),
      q("How often should meetings occur?", ["Weekly", "Monthly", "Every six months"], "Monthly", "六个月内每月会面一次。"),
      q("Which issue must a mentor report?", ["A routine career question", "A serious safety concern", "A request for contacts"], "A serious safety concern", "安全、违法或严重健康风险不属于保密范围。"),
    ],
  },
  {
    id: "r46", skill: "reading", section: "Section 2", title: "工作事故上报流程", level: "进阶", minutes: 18,
    focus: "即时处理、证据、险情与复工",
    text: "ACCIDENT AND NEAR-MISS REPORTING\nFirst make the area safe without putting yourself at risk, then contact a trained first aider if anyone is injured. Inform the shift manager as soon as possible. Complete the digital incident form before leaving work, including the location, task and names of witnesses. Photographs may be attached if taking them is safe, but do not photograph an injured person without consent. Report near misses as well as injuries because they reveal hazards before harm occurs. Do not restart damaged equipment until an authorised technician has inspected and released it.",
    questions: [
      q("What is the first priority after an incident?", ["Completing the form", "Making the area safe", "Taking photographs"], "Making the area safe", "第一步是在不让自己冒险的情况下确保区域安全。"),
      q("When should the digital form be completed?", ["Before leaving work", "Within one month", "After equipment restarts"], "Before leaving work", "要求离开工作地点前填完。"),
      q("Why must near misses be reported?", ["They show hazards before injury", "They always damage equipment", "They replace witness names"], "They show hazards before injury", "险情能在造成伤害前暴露危险。"),
      q("Who may release damaged equipment for use?", ["Any witness", "An authorised technician", "The injured employee"], "An authorised technician", "损坏设备必须经授权技术员检查并放行。"),
    ],
  },
  {
    id: "r47", skill: "reading", section: "Section 3", title: "旧建筑如何获得新用途", level: "模考", minutes: 22,
    focus: "环境价值、设计限制、经济风险与社区参与",
    text: "Converting an old factory, school or warehouse for a new use is often called adaptive reuse. Keeping the main structure can avoid much of the waste and carbon associated with demolition and new construction. Historic buildings may also give a project an identity that a completely new development lacks.\n\nReuse is not automatically cheaper. Surveys may reveal weak foundations, harmful materials or heating systems that are difficult to upgrade. Wide factory floors can become attractive offices, but deep spaces may leave homes without enough natural light. Successful designers decide early which features have real value and which alterations are necessary for safety and accessibility.\n\nLocal involvement can reduce another risk: creating an impressive building that does not meet neighbourhood needs. Temporary events and small pilot uses allow residents and businesses to test ideas before a permanent plan is fixed. The best projects therefore balance memory with practical change. They preserve a connection to local history while accepting that a building survives only if people can use it well today.",
    questions: [
      q("What environmental benefit can reuse provide?", ["It avoids some demolition waste and carbon", "It removes every old material", "It requires no construction work"], "It avoids some demolition waste and carbon", "保留主体结构可避免大量拆除废物和新建碳排放。"),
      q("Why may deep factory spaces be unsuitable for homes?", ["They have too many gardens", "They may lack natural light", "They always have narrow floors"], "They may lack natural light", "较深空间可能让住宅得不到足够自然光。"),
      q("What is the purpose of temporary pilot uses?", ["To avoid all safety checks", "To test ideas before a permanent decision", "To prevent local participation"], "To test ideas before a permanent decision", "临时活动让社区在长期方案确定前试验想法。"),
      q("What balance does the writer support?", ["History and present usefulness", "Low cost and no change", "Tourism and private ownership"], "History and present usefulness", "结论主张保留历史联系，同时满足今天的实际使用。"),
    ],
  },
  {
    id: "r48", skill: "reading", section: "Section 3", title: "城市为什么需要更多座椅", level: "模考", minutes: 22,
    focus: "可达性、选址、争议与评估方法",
    text: "Public seating is easy to overlook because it occupies little space and earns no direct income. Yet a bench can determine whether an older person walks to local shops, whether a parent can pause with a child, or whether a public square invites people to stay rather than pass through.\n\nLocation matters more than the total number installed. Seats are useful near slopes, transport stops and services, with some placed in shade and others in sun. Designs should include armrests that help people stand, while leaving space beside a bench for a wheelchair or pushchair. Authorities sometimes remove seating after complaints about noise or antisocial behaviour, but this can punish all users without addressing the cause.\n\nGood evaluation combines observation with conversation. Counting how long seats are occupied shows demand, while interviews reveal who avoids an area and why. Seating should not be treated as decoration added at the end of a project. It is small-scale transport and social infrastructure that can make ordinary journeys possible for a wider range of people.",
    questions: [
      q("How can a bench affect an older person?", ["It may make a walking journey possible", "It guarantees free transport", "It removes every slope"], "It may make a walking journey possible", "座椅可决定老年人是否能步行去本地商店。"),
      q("Where does the writer recommend placing seats?", ["Only inside shops", "Near slopes, stops and services", "Only in direct sunlight"], "Near slopes, stops and services", "第二段明确建议靠近坡道、交通站点和服务设施。"),
      q("What problem may result from removing seats?", ["All users are penalised", "More shade is created", "Interviews become easier"], "All users are penalised", "因少数投诉移除座椅会惩罚所有使用者。"),
      q("Why are interviews useful in evaluation?", ["They measure bench weight", "They reveal who avoids the area and why", "They replace all observation"], "They reveal who avoids the area and why", "访谈能说明哪些人避开区域以及原因。"),
    ],
  },
];

const task1Checklist = ["开头直接说明写信目的", "三个任务点都有具体事实、请求或安排", "语气符合正式或私人关系", "至少 150 词并检查时态、拼写和分段"];
const task2Checklist = ["引言回应题目并明确立场或范围", "主体段有中心句、解释和具体例子", "比较、因果或让步关系清楚", "至少 250 词且结论不加入新观点"];

export const writingBatch05: CourseLesson[] = [
  { id: "w41", skill: "writing", section: "Task 1 · 正式信", title: "课程取消后申请退款", level: "进阶", minutes: 26, focus: "付款证据、实际影响与解决时限", task: "A course you paid for was cancelled, but you have not received the promised refund. Write a letter to the course provider. Write at least 150 words.", bullets: ["give the course and payment details", "explain what communication you have already received", "request a refund and a clear deadline"], checklist: task1Checklist },
  { id: "w42", skill: "writing", section: "Task 1 · 私人信", title: "向朋友借用设备", level: "进阶", minutes: 26, focus: "借用原因、使用方式与归还保障", task: "You need to borrow a piece of equipment that a friend owns. Write a letter to your friend. Write at least 150 words.", bullets: ["explain what you would like to borrow", "say why and when you need it", "explain how you will look after and return it"], checklist: task1Checklist },
  { id: "w43", skill: "writing", section: "Task 1 · 半正式信", title: "建议公司组织志愿服务日", level: "进阶", minutes: 26, focus: "活动价值、具体安排与业务保障", task: "You would like your workplace to organise a day when staff volunteer in the local community. Write a letter to your manager. Write at least 150 words.", bullets: ["describe the volunteering activity", "explain how staff and the community would benefit", "suggest how work could be covered that day"], checklist: task1Checklist },
  { id: "w44", skill: "writing", section: "Task 1 · 私人信", title: "请邻居代为照看住所", level: "进阶", minutes: 26, focus: "离开时间、具体事项与紧急联系", task: "You will be away from home and would like a neighbour to look after a few things. Write a letter to your neighbour. Write at least 150 words.", bullets: ["say when and why you will be away", "explain what help you need", "give access and emergency contact arrangements"], checklist: task1Checklist },
  { id: "w45", skill: "writing", section: "Task 2 · 优缺点", title: "社会逐渐减少现金使用", level: "模考", minutes: 42, focus: "便利、成本、隐私与排除风险", task: "Many societies are moving towards payments made without cash. What are the advantages and disadvantages of this development? Write at least 250 words.", bullets: ["explain convenience or business benefits", "consider privacy, reliability and financial exclusion", "use examples from different users and situations"], checklist: task2Checklist },
  { id: "w46", skill: "writing", section: "Task 2 · 双边讨论", title: "旅游推广还是保护本地生活", level: "模考", minutes: 42, focus: "比较收入、公共服务与居民承受力", task: "Some people think towns should attract more tourists, while others believe local quality of life should be protected from tourism growth. Discuss both views and give your own opinion. Write at least 250 words.", bullets: ["explain economic and cultural benefits", "consider housing, crowding and service pressures", "give a balanced policy position"], checklist: task2Checklist },
  { id: "w47", skill: "writing", section: "Task 2 · 问题与对策", title: "家庭食品浪费", level: "模考", minutes: 42, focus: "分析购买、储存与信息原因", task: "Large amounts of food are wasted by households. Why does this happen, and what measures could reduce the problem? Write at least 250 words.", bullets: ["identify purchasing or storage causes", "explain the role of dates, habits or packaging", "evaluate household, retailer and government measures"], checklist: task2Checklist },
  { id: "w48", skill: "writing", section: "Task 2 · 观点", title: "成年人持续学习", level: "模考", minutes: 42, focus: "限定责任并处理时间和费用障碍", task: "Adults should continue learning new knowledge and skills throughout their lives. To what extent do you agree or disagree? Write at least 250 words.", bullets: ["state the extent of your agreement", "explain benefits for work and personal life", "consider who should provide time, access and funding"], checklist: task2Checklist },
];

export const speakingBatch05: CourseLesson[] = [
  { id: "s41", skill: "speaking", section: "Part 1", title: "鞋子", level: "进阶", minutes: 10, focus: "使用场景、购买标准、过去变化与偏好", prompts: ["What kind of shoes do you wear most often?", "What matters when you buy shoes?", "Did you choose different shoes when you were younger?", "Do you prefer practical or fashionable shoes?"], keywords: ["most often", "because", "used to", "prefer"] },
  { id: "s42", skill: "speaking", section: "Part 1", title: "手写与记笔记", level: "进阶", minutes: 10, focus: "频率、用途、工具比较和未来变化", prompts: ["How often do you write by hand?", "What do you usually write on paper?", "Is typing easier than handwriting for you?", "Do you think people will write less by hand in the future?"], keywords: ["often", "usually", "whereas", "future"] },
  { id: "s43", skill: "speaking", section: "Part 1", title: "安静的地方", level: "进阶", minutes: 10, focus: "地点、活动、寻找难度与变化", prompts: ["Where do you go when you need a quiet place?", "What do you like doing there?", "Is it easy to find quiet places near your home?", "Were public places quieter in the past?"], keywords: ["usually", "because", "easy", "used to"] },
  { id: "s44", skill: "speaking", section: "Part 2", title: "借用过的一件物品", level: "进阶", minutes: 14, focus: "需求、借用过程、使用与归还", task: "Describe something useful that you borrowed from another person.", bullets: ["what the item was", "who lent it to you", "why you needed it", "how you used and returned it"], prompts: ["You have one minute to prepare. Then speak for up to two minutes."], keywords: ["needed", "offered", "used", "returned"] },
  { id: "s45", skill: "speaking", section: "Part 2", title: "参加过的本地活动", level: "进阶", minutes: 14, focus: "时间地点、活动内容、人群与感受", task: "Describe a local event that you attended and remember well.", bullets: ["what and where the event was", "who you went with", "what happened there", "why you remember it"], prompts: ["You have one minute to prepare. Then speak for up to two minutes."], keywords: ["took place", "while", "especially", "remember"] },
  { id: "s46", skill: "speaking", section: "Part 2", title: "改善日常生活的一次改变", level: "进阶", minutes: 14, focus: "改变前的问题、实施过程与具体结果", task: "Describe a change at home, work or in your routine that made daily life better.", bullets: ["what the situation was before", "what change was made", "who was involved", "why the result was useful"], prompts: ["You have one minute to prepare. Then speak for up to two minutes."], keywords: ["before", "decided", "as a result", "easier"] },
  { id: "s47", skill: "speaking", section: "Part 3", title: "借用、共享与拥有", level: "模考", minutes: 16, focus: "比较便利、责任、成本和未来模式", prompts: ["Why do some people prefer owning things rather than borrowing them?", "Which items are most suitable for sharing?", "What problems can occur when people borrow valuable items?", "Will shared services become more common in the future?"], keywords: ["one reason", "suitable", "however", "might"] },
  { id: "s48", skill: "speaking", section: "Part 3", title: "成人教育与终身学习", level: "模考", minutes: 16, focus: "动机、障碍、出资责任与技术影响", prompts: ["Why do adults decide to study again?", "What prevents some adults from continuing education?", "Should employers pay for employees' training?", "How will technology change adult learning?"], keywords: ["because", "barrier", "depends", "will"] },
];

export const curriculumBatch05: CourseLesson[] = [
  ...listeningBatch05,
  ...readingBatch05,
  ...writingBatch05,
  ...speakingBatch05,
];
