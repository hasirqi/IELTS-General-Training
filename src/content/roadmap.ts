export type RoadmapWeek = {
  week: number;
  stage: "打基础" | "场景能力" | "考试整合";
  theme: string;
  grammar: string;
  skillFocus: string;
};

export const roadmapWeeks: RoadmapWeek[] = [
  {week:1,stage:"打基础",theme:"个人信息与拼写",grammar:"be 动词与人称代词",skillFocus:"听写姓名、回答个人问题"},
  {week:2,stage:"打基础",theme:"日期、时间与数字",grammar:"时间介词 at/on/in",skillFocus:"辨别数字、填写表格"},
  {week:3,stage:"打基础",theme:"预约与医疗",grammar:"would like to",skillFocus:"电话预约、说明症状"},
  {week:4,stage:"打基础",theme:"交通与问路",grammar:"祈使句与地点介词",skillFocus:"路线信息、交通公告"},
  {week:5,stage:"打基础",theme:"购物与退款",grammar:"可数与不可数名词",skillFocus:"价格、商品问题、投诉"},
  {week:6,stage:"打基础",theme:"住房与租赁",grammar:"there is/are",skillFocus:"读广告、描述住房"},
  {week:7,stage:"打基础",theme:"工作与日程",grammar:"一般现在时",skillFocus:"班次、职责、日常回答"},
  {week:8,stage:"打基础",theme:"过去经历",grammar:"一般过去时",skillFocus:"讲述事件、识别时间顺序"},
  {week:9,stage:"场景能力",theme:"社区服务",grammar:"can/must/should",skillFocus:"规则、许可和建议"},
  {week:10,stage:"场景能力",theme:"图书馆与课程",grammar:"冠词与单复数",skillFocus:"比较课程、询问信息"},
  {week:11,stage:"场景能力",theme:"健康习惯",grammar:"频率副词",skillFocus:"Part 1 扩展回答"},
  {week:12,stage:"场景能力",theme:"安全与紧急情况",grammar:"被动语态基础",skillFocus:"工作手册、紧急指令"},
  {week:13,stage:"场景能力",theme:"求职与培训",grammar:"现在完成时",skillFocus:"工作经历、申请条件"},
  {week:14,stage:"场景能力",theme:"客户服务",grammar:"礼貌请求与间接问句",skillFocus:"投诉信、电话沟通"},
  {week:15,stage:"场景能力",theme:"公共通知",grammar:"条件句基础",skillFocus:"例外、截止日期和限制"},
  {week:16,stage:"场景能力",theme:"休假与工作政策",grammar:"情态动词的强弱",skillFocus:"Section 2 规则定位"},
  {week:17,stage:"场景能力",theme:"环境与回收",grammar:"because/so/due to",skillFocus:"原因结果、问题解决"},
  {week:18,stage:"场景能力",theme:"志愿服务",grammar:"定语从句 who/which",skillFocus:"描述人、岗位和活动"},
  {week:19,stage:"场景能力",theme:"城市生活",grammar:"比较级与最高级",skillFocus:"比较方案、表达偏好"},
  {week:20,stage:"场景能力",theme:"远程工作",grammar:"although/whereas",skillFocus:"讨论双方与让步"},
  {week:21,stage:"考试整合",theme:"正式书信",grammar:"正式请求结构",skillFocus:"Task 1 目的和三点覆盖"},
  {week:22,stage:"考试整合",theme:"半正式与私人书信",grammar:"语气与称呼",skillFocus:"切换语域、自然细节"},
  {week:23,stage:"考试整合",theme:"观点议论文",grammar:"谨慎表达 may/can",skillFocus:"明确立场和论证"},
  {week:24,stage:"考试整合",theme:"双边讨论",grammar:"on the other hand/whereas",skillFocus:"平衡讨论并给观点"},
  {week:25,stage:"考试整合",theme:"原因与解决方案",grammar:"因果链表达",skillFocus:"方案与原因对应"},
  {week:26,stage:"考试整合",theme:"长文主旨",grammar:"指代与段落连接",skillFocus:"Section 3 主旨、指代"},
  {week:27,stage:"考试整合",theme:"推断与作者立场",grammar:"让步和限定词",skillFocus:"区分事实与判断"},
  {week:28,stage:"考试整合",theme:"听力 Part 3",grammar:"观点动词和转折",skillFocus:"最终决定、态度变化"},
  {week:29,stage:"考试整合",theme:"听力 Part 4",grammar:"名词化与笔记结构",skillFocus:"讲座框架、因果例子"},
  {week:30,stage:"考试整合",theme:"口语 Part 2",grammar:"过去、现在、未来切换",skillFocus:"准备一分钟、说两分钟"},
  {week:31,stage:"考试整合",theme:"口语 Part 3",grammar:"观点—原因—例子",skillFocus:"抽象讨论与比较"},
  {week:32,stage:"考试整合",theme:"限时阅读",grammar:"复杂句主干识别",skillFocus:"定位、跳过、回查"},
  {week:33,stage:"考试整合",theme:"限时写作",grammar:"错误优先级",skillFocus:"计划、成文、检查"},
  {week:34,stage:"考试整合",theme:"听读联合模考",grammar:"错因分类",skillFocus:"一次作答与时间管理"},
  {week:35,stage:"考试整合",theme:"写说联合模考",grammar:"稳定输出",skillFocus:"官方维度自检"},
  {week:36,stage:"考试整合",theme:"弱点回炉与毕业判断",grammar:"个人高频错误",skillFocus:"两次稳定达到目标"},
];
