// src/services/arena/soloService.ts
import { Groq } from 'groq-sdk';

const ACTIVE_GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const groq = new Groq({ apiKey: ACTIVE_GROQ_KEY, dangerouslyAllowBrowser: true });

export interface SoloTopic {
  id: string;
  title: string;
  promptEn: string;
  promptVi?: string;
  keywords: string[];
}

const sessionUsedTopicTexts: Set<string> = new Set();

export function clearSoloTopicHistory() {
  sessionUsedTopicTexts.clear();
}

// 📦 KHO DỮ LIỆU LOCAL 50 CHỦ ĐỀ ĐỘC BẢN CHO MỖI LEVEL (TỔNG 300 CHỦ ĐỀ SOLO)
const LOCAL_SOLO_POOL: Record<string, SoloTopic[]> = {
  A1: [
    { id: 's_a1_1', title: "Solo Pulse [A1]", promptEn: "Describe your daily morning routine and what you eat for breakfast.", promptVi: "Mô tả thói quen buổi sáng hàng ngày và món ăn sáng của bạn.", keywords: ["routine", "breakfast"] },
    { id: 's_a1_2', title: "Solo Pulse [A1]", promptEn: "Talk about your favorite hobby and why you enjoy it.", promptVi: "Nói về sở thích yêu thích của bạn và lý do bạn thích nó.", keywords: ["hobby", "free time"] },
    { id: 's_a1_3', title: "Solo Pulse [A1]", promptEn: "Describe your best friend and how you met each other.", promptVi: "Mô tả người bạn thân nhất của bạn và cách hai bạn gặp nhau.", keywords: ["friend", "relationship"] },
    { id: 's_a1_4', title: "Solo Pulse [A1]", promptEn: "Talk about your hometown and your favorite place in it.", promptVi: "Nói về quê hương bạn và địa điểm bạn yêu thích nhất ở đó.", keywords: ["hometown", "place"] },
    { id: 's_a1_5', title: "Solo Pulse [A1]", promptEn: "Describe your family members and their jobs.", promptVi: "Mô tả các thành viên trong gia đình bạn và công việc của họ.", keywords: ["family", "jobs"] },
    { id: 's_a1_6', title: "Solo Pulse [A1]", promptEn: "Talk about your favorite season of the year and the weather.", promptVi: "Nói về mùa yêu thích nhất trong năm và thời tiết.", keywords: ["season", "weather"] },
    { id: 's_a1_7', title: "Solo Pulse [A1]", promptEn: "Describe your bedroom and your favorite items in it.", promptVi: "Mô tả phòng ngủ của bạn và món đồ bạn thích nhất.", keywords: ["bedroom", "home"] },
    { id: 's_a1_8', title: "Solo Pulse [A1]", promptEn: "Talk about what you usually do on weekends.", promptVi: "Nói về những việc bạn thường làm vào cuối tuần.", keywords: ["weekend", "activities"] },
    { id: 's_a1_9', title: "Solo Pulse [A1]", promptEn: "Describe your favorite animal and why you like it.", promptVi: "Mô tả động vật yêu thích của bạn và lý do bạn thích nó.", keywords: ["animal", "pet"] },
    { id: 's_a1_10', title: "Solo Pulse [A1]", promptEn: "Talk about your favorite food and how often you eat it.", promptVi: "Nói về món ăn yêu thích của bạn và tần suất bạn ăn nó.", keywords: ["food", "meal"] },
    { id: 's_a1_11', title: "Solo Pulse [A1]", promptEn: "Describe your favorite teacher at school.", promptVi: "Mô tả người thầy/cô giáo yêu thích của bạn ở trường.", keywords: ["teacher", "school"] },
    { id: 's_a1_12', title: "Solo Pulse [A1]", promptEn: "Talk about the music you listen to every day.", promptVi: "Nói về dòng nhạc bạn nghe hàng ngày.", keywords: ["music", "daily"] },
    { id: 's_a1_13', title: "Solo Pulse [A1]", promptEn: "Describe your favorite pair of shoes or clothes.", promptVi: "Mô tả đôi giày hoặc bộ quần áo yêu thích của bạn.", keywords: ["clothes", "fashion"] },
    { id: 's_a1_14', title: "Solo Pulse [A1]", promptEn: "Talk about what you do in the evening before sleeping.", promptVi: "Nói về những việc bạn làm vào buổi tối trước khi đi ngủ.", keywords: ["night", "routine"] },
    { id: 's_a1_15', title: "Solo Pulse [A1]", promptEn: "Describe a park near your house and what people do there.", promptVi: "Mô tả một công viên gần nhà bạn và những gì mọi người làm ở đó.", keywords: ["park", "nature"] },
    { id: 's_a1_16', title: "Solo Pulse [A1]", promptEn: "Talk about your favorite drink on a hot summer day.", promptVi: "Nói về thức uống yêu thích của bạn vào ngày hè nóng nực.", keywords: ["drink", "summer"] },
    { id: 's_a1_17', title: "Solo Pulse [A1]", promptEn: "Describe your favorite fruit and how it tastes.", promptVi: "Mô tả loại trái cây yêu thích của bạn và hương vị của nó.", keywords: ["fruit", "food"] },
    { id: 's_a1_18', title: "Solo Pulse [A1]", promptEn: "Talk about a birthday present you received that made you happy.", promptVi: "Nói về một món quà sinh nhật khiến bạn hạnh phúc.", keywords: ["gift", "birthday"] },
    { id: 's_a1_19', title: "Solo Pulse [A1]", promptEn: "Describe your commute to school or work.", promptVi: "Mô tả quãng đường đi học hoặc đi làm của bạn.", keywords: ["commute", "travel"] },
    { id: 's_a1_20', title: "Solo Pulse [A1]", promptEn: "Talk about a game you played with your friends recently.", promptVi: "Nói về một trò chơi bạn đã chơi cùng bạn bè gần đây.", keywords: ["game", "friends"] },
    { id: 's_a1_21', title: "Solo Pulse [A1]", promptEn: "Describe your favorite ice cream flavor and where you buy it.", promptVi: "Mô tả vị kem yêu thích của bạn và nơi bạn mua nó.", keywords: ["ice cream", "treat"] },
    { id: 's_a1_22', title: "Solo Pulse [A1]", promptEn: "Talk about your favorite sport and who you play it with.", promptVi: "Nói về môn thể thao yêu thích và người bạn thường chơi cùng.", keywords: ["sport", "exercise"] },
    { id: 's_a1_23', title: "Solo Pulse [A1]", promptEn: "Describe what you usually wear to a birthday party.", promptVi: "Mô tả trang phục bạn thường mặc đến tiệc sinh nhật.", keywords: ["clothes", "party"] },
    { id: 's_a1_24', title: "Solo Pulse [A1]", promptEn: "Talk about your favorite restaurant and the dish you order.", promptVi: "Nói về nhà hàng yêu thích và món ăn bạn hay gọi.", keywords: ["restaurant", "dining"] },
    { id: 's_a1_25', title: "Solo Pulse [A1]", promptEn: "Describe what you do when it rains all day.", promptVi: "Mô tả những việc bạn làm khi trời mưa cả ngày.", keywords: ["rain", "indoor"] },
    { id: 's_a1_26', title: "Solo Pulse [A1]", promptEn: "Talk about a movie character that you really like.", promptVi: "Nói về một nhân vật phim mà bạn rất thích.", keywords: ["movie", "character"] },
    { id: 's_a1_27', title: "Solo Pulse [A1]", promptEn: "Describe your favorite spot in your house to relax.", promptVi: "Mô tả góc thư giãn yêu thích nhất trong nhà bạn.", keywords: ["relax", "home"] },
    { id: 's_a1_28', title: "Solo Pulse [A1]", promptEn: "Talk about the subject you like most at school.", promptVi: "Nói về môn học bạn thích nhất ở trường.", keywords: ["school", "subject"] },
    { id: 's_a1_29', title: "Solo Pulse [A1]", promptEn: "Describe a bicycle or vehicle you own or want to have.", promptVi: "Mô tả chiếc xe đạp hoặc xe máy bạn có hoặc muốn sở hữu.", keywords: ["vehicle", "transport"] },
    { id: 's_a1_30', title: "Solo Pulse [A1]", promptEn: "Talk about a fun place you visited with your family.", promptVi: "Nói về một nơi thú vị bạn từng đi chơi cùng gia đình.", keywords: ["trip", "family"] },
    { id: 's_a1_31', title: "Solo Pulse [A1]", promptEn: "Describe what you usually pack in your backpack every morning.", promptVi: "Mô tả những món đồ bạn thường chuẩn bị trong balo mỗi sáng.", keywords: ["backpack", "school"] },
    { id: 's_a1_32', title: "Solo Pulse [A1]", promptEn: "Talk about your favorite hot drink in winter.", promptVi: "Nói về đồ uống nóng yêu thích của bạn vào mùa đông.", keywords: ["winter", "drink"] },
    { id: 's_a1_33', title: "Solo Pulse [A1]", promptEn: "Describe a market near your house and what you buy there.", promptVi: "Mô tả khu chợ gần nhà bạn và những gì bạn hay mua.", keywords: ["market", "shopping"] },
    { id: 's_a1_34', title: "Solo Pulse [A1]", promptEn: "Talk about a fun cartoon you watch on TV.", promptVi: "Nói về một bộ phim hoạt hình vui nhộn bạn xem trên TV.", keywords: ["cartoon", "tv"] },
    { id: 's_a1_35', title: "Solo Pulse [A1]", promptEn: "Describe your favorite flower or plant in your garden.", promptVi: "Mô tả loài hoa hoặc cây trồng bạn thích trong vườn.", keywords: ["flower", "garden"] },
    { id: 's_a1_36', title: "Solo Pulse [A1]", promptEn: "Talk about how you help your parents with housework.", promptVi: "Nói về cách bạn giúp đỡ bố mẹ làm việc nhà.", keywords: ["housework", "family"] },
    { id: 's_a1_37', title: "Solo Pulse [A1]", promptEn: "Describe your favorite bakery item or cake.", promptVi: "Mô tả món bánh nướng hoặc bánh sinh nhật bạn thích nhất.", keywords: ["bakery", "cake"] },
    { id: 's_a1_38', title: "Solo Pulse [A1]", promptEn: "Talk about a game app you like playing on your phone.", promptVi: "Nói về một ứng dụng trò chơi bạn thích chơi trên điện thoại.", keywords: ["mobile game", "phone"] },
    { id: 's_a1_39', title: "Solo Pulse [A1]", promptEn: "Describe what you like to do on a sunny afternoon.", promptVi: "Mô tả những việc bạn thích làm vào một chiều nắng đẹp.", keywords: ["sun", "afternoon"] },
    { id: 's_a1_40', title: "Solo Pulse [A1]", promptEn: "Talk about a toy you loved when you were younger.", promptVi: "Nói về món đồ chơi bạn rất yêu thích khi còn nhỏ.", keywords: ["toy", "childhood"] },
    { id: 's_a1_41', title: "Solo Pulse [A1]", promptEn: "Describe your favorite holiday meal with your family.", promptVi: "Mô tả bữa ăn ngày lễ yêu thích của gia đình bạn.", keywords: ["holiday", "meal"] },
    { id: 's_a1_42', title: "Solo Pulse [A1]", promptEn: "Talk about a zoo animal you enjoy watching.", promptVi: "Nói về một loài động vật ở sở thú bạn thích ngắm nhìn.", keywords: ["zoo", "animal"] },
    { id: 's_a1_43', title: "Solo Pulse [A1]", promptEn: "Describe the color of your room and why you picked it.", promptVi: "Mô tả màu sơn phòng ngủ và lý do bạn chọn màu đó.", keywords: ["room", "color"] },
    { id: 's_a1_44', title: "Solo Pulse [A1]", promptEn: "Talk about how you celebrate New Year's Day.", promptVi: "Nói về cách bạn ăn mừng ngày Tết / Năm mới.", keywords: ["new year", "celebration"] },
    { id: 's_a1_45', title: "Solo Pulse [A1]", promptEn: "Describe a fast food meal you like to order.", promptVi: "Mô tả suất thức ăn nhanh bạn hay gọi.", keywords: ["fast food", "meal"] },
    { id: 's_a1_46', title: "Solo Pulse [A1]", promptEn: "Talk about your favorite song and the singer who sings it.", promptVi: "Nói về bài hát yêu thích và ca sĩ thể hiện nó.", keywords: ["song", "singer"] },
    { id: 's_a1_47', title: "Solo Pulse [A1]", promptEn: "Describe a beach trip you went on with friends or family.", promptVi: "Mô tả chuyến đi biển của bạn cùng bạn bè hoặc gia đình.", keywords: ["beach", "sea"] },
    { id: 's_a1_48', title: "Solo Pulse [A1]", promptEn: "Talk about your daily sleep routine and bedtime.", promptVi: "Nói về thói quen ngủ nghỉ và giờ giấc đi ngủ của bạn.", keywords: ["sleep", "bedtime"] },
    { id: 's_a1_49', title: "Solo Pulse [A1]", promptEn: "Describe your favorite hat, jacket, or accessory.", promptVi: "Mô tả chiếc chiếc mũ, áo khoác hoặc phụ kiện bạn thích nhất.", keywords: ["fashion", "accessory"] },
    { id: 's_a1_50', title: "Solo Pulse [A1]", promptEn: "Talk about what you want to do tomorrow.", promptVi: "Nói về những việc bạn muốn thực hiện vào ngày mai.", keywords: ["tomorrow", "plans"] }
  ],
  A2: [
    { id: 's_a2_1', title: "Solo Pulse [A2]", promptEn: "Describe a memorable vacation or trip you took recently.", promptVi: "Mô tả một kỳ nghỉ hoặc chuyến đi đáng nhớ bạn vừa trải qua.", keywords: ["vacation", "travel"] },
    { id: 's_a2_2', title: "Solo Pulse [A2]", promptEn: "Talk about a movie you watched recently and liked.", promptVi: "Nói về một bộ phim bạn mới xem gần đây và yêu thích.", keywords: ["movie", "entertainment"] },
    { id: 's_a2_3', title: "Solo Pulse [A2]", promptEn: "Describe your dream job and what skills you need for it.", promptVi: "Mô tả công việc mơ ước của bạn và kỹ năng cần có.", keywords: ["career", "skills"] },
    { id: 's_a2_4', title: "Solo Pulse [A2]", promptEn: "Talk about how you use technology in your daily life.", promptVi: "Nói về cách bạn sử dụng công nghệ trong cuộc sống hàng ngày.", keywords: ["technology", "gadgets"] },
    { id: 's_a2_5', title: "Solo Pulse [A2]", promptEn: "Describe a special festival or holiday in your country.", promptVi: "Mô tả một lễ hội hoặc ngày lễ đặc biệt ở quốc gia bạn.", keywords: ["festival", "culture"] },
    { id: 's_a2_6', title: "Solo Pulse [A2]", promptEn: "Talk about a sport or physical exercise you enjoy.", promptVi: "Nói về một môn thể thao hoặc bài tập thể dục bạn thích.", keywords: ["sport", "fitness"] },
    { id: 's_a2_7', title: "Solo Pulse [A2]", promptEn: "Describe your shopping habits and where you buy clothes.", promptVi: "Mô tả thói quen mua sắm và nơi bạn thường mua quần áo.", keywords: ["shopping", "clothes"] },
    { id: 's_a2_8', title: "Solo Pulse [A2]", promptEn: "Talk about a skill you want to learn in the future.", promptVi: "Nói về một kỹ năng bạn muốn học trong tương lai.", keywords: ["skill", "learning"] },
    { id: 's_a2_9', title: "Solo Pulse [A2]", promptEn: "Describe a restaurant you like and the food they serve.", promptVi: "Mô tả một nhà hàng bạn thích và món ăn ở đó.", keywords: ["restaurant", "food"] },
    { id: 's_a2_10', title: "Solo Pulse [A2]", promptEn: "Talk about transport options in your city and how you travel.", promptVi: "Nói về các phương tiện giao thông ở thành phố bạn.", keywords: ["transport", "city"] },
    { id: 's_a2_11', title: "Solo Pulse [A2]", promptEn: "Describe an interesting book you read and why you recommend it.", promptVi: "Mô tả một cuốn sách hay bạn đã đọc và lý do bạn tiến cử nó.", keywords: ["book", "reading"] },
    { id: 's_a2_12', title: "Solo Pulse [A2]", promptEn: "Talk about a challenge you faced at school or work and solved.", promptVi: "Nói về một thử thách bạn đã vượt qua ở trường hoặc công sở.", keywords: ["challenge", "problem"] },
    { id: 's_a2_13', title: "Solo Pulse [A2]", promptEn: "Describe your favorite app on your smartphone and its main features.", promptVi: "Mô tả ứng dụng điện thoại yêu thích của bạn và các tính năng chính.", keywords: ["app", "smartphone"] },
    { id: 's_a2_14', title: "Solo Pulse [A2]", promptEn: "Talk about a celebration you had with your family recently.", promptVi: "Nói về một bữa tiệc kỷ niệm gia đình bạn mới tổ chức gần đây.", keywords: ["celebration", "family"] },
    { id: 's_a2_15', title: "Solo Pulse [A2]", promptEn: "Describe how you prepare for an important exam or meeting.", promptVi: "Mô tả cách bạn chuẩn bị cho một kỳ thi hoặc cuộc họp quan trọng.", keywords: ["exam", "preparation"] },
    { id: 's_a2_16', title: "Solo Pulse [A2]", promptEn: "Talk about a gift you bought for someone else.", promptVi: "Nói về một món quà bạn đã mua tặng người khác.", keywords: ["gift", "shopping"] },
    { id: 's_a2_17', title: "Solo Pulse [A2]", promptEn: "Describe a cafe where you like to study or relax.", promptVi: "Mô tả một quán cafe bạn thích ngồi học tập hoặc thư giãn.", keywords: ["cafe", "relaxation"] },
    { id: 's_a2_18', title: "Solo Pulse [A2]", promptEn: "Talk about your favorite TV show and its main characters.", promptVi: "Nói về chương trình truyền hình yêu thích và các nhân vật chính.", keywords: ["tv show", "media"] },
    { id: 's_a2_19', title: "Solo Pulse [A2]", promptEn: "Describe a place in your country that you want to visit.", promptVi: "Mô tả một địa điểm ở nước bạn mà bạn rất muốn đến tham quan.", keywords: ["travel", "destination"] },
    { id: 's_a2_20', title: "Solo Pulse [A2]", promptEn: "Talk about how you manage your money and savings.", promptVi: "Nói về cách bạn quản lý tiền bạc và khoản tiết kiệm của mình.", keywords: ["money", "savings"] },
    { id: 's_a2_21', title: "Solo Pulse [A2]", promptEn: "Describe a funny accident or mistake that happened to you.", promptVi: "Mô tả một nhầm lẫn hoặc sự cố hài hước xảy ra với bạn.", keywords: ["funny", "mistake"] },
    { id: 's_a2_22', title: "Solo Pulse [A2]", promptEn: "Talk about your favorite outdoor activity during autumn.", promptVi: "Nói về hoạt động ngoài trời yêu thích của bạn vào mùa thu.", keywords: ["autumn", "outdoor"] },
    { id: 's_a2_23', title: "Solo Pulse [A2]", promptEn: "Describe a museum or art exhibition you visited.", promptVi: "Mô tả một bảo tàng hoặc triển lãm nghệ thuật bạn từng đến.", keywords: ["museum", "art"] },
    { id: 's_a2_24', title: "Solo Pulse [A2]", promptEn: "Talk about an English video or podcast that helped you learn.", promptVi: "Nói về một video hoặc podcast tiếng Anh giúp bạn học tập.", keywords: ["learning", "english"] },
    { id: 's_a2_25', title: "Solo Pulse [A2]", promptEn: "Describe how you keep your bedroom clean and organized.", promptVi: "Mô tả cách bạn giữ cho phòng ngủ sạch sẽ và ngăn nắp.", keywords: ["clean", "bedroom"] },
    { id: 's_a2_26', title: "Solo Pulse [A2]", promptEn: "Talk about a local news story that caught your attention.", promptVi: "Nói về một tin tức địa phương thu hút sự chú ý của bạn.", keywords: ["news", "local"] },
    { id: 's_a2_27', title: "Solo Pulse [A2]", promptEn: "Describe a traditional dish from your culture and how to cook it.", promptVi: "Mô tả một món ăn truyền thống và cách chế biến nó.", keywords: ["traditional", "dish"] },
    { id: 's_a2_28', title: "Solo Pulse [A2]", promptEn: "Talk about a concert or live performance you attended.", promptVi: "Nói về một buổi hòa nhạc hoặc biểu diễn trực tiếp bạn tham dự.", keywords: ["concert", "music"] },
    { id: 's_a2_29', title: "Solo Pulse [A2]", promptEn: "Describe your favorite shopping mall and what it offers.", promptVi: "Mô tả trung tâm thương mại yêu thích và dịch vụ ở đó.", keywords: ["mall", "shopping"] },
    { id: 's_a2_30', title: "Solo Pulse [A2]", promptEn: "Talk about a habit you want to stop or change.", promptVi: "Nói về một thói quen xấu bạn muốn từ bỏ hoặc thay đổi.", keywords: ["habit", "self-improvement"] },
    { id: 's_a2_31', title: "Solo Pulse [A2]", promptEn: "Describe a memorable birthday party you had in the past.", promptVi: "Mô tả một bữa tiệc sinh nhật đáng nhớ trong quá khứ.", keywords: ["birthday", "past"] },
    { id: 's_a2_32', title: "Solo Pulse [A2]", promptEn: "Talk about an interesting neighbor in your apartment building.", promptVi: "Nói về một người hàng xóm thú vị trong khu căn hộ của bạn.", keywords: ["neighbor", "people"] },
    { id: 's_a2_33', title: "Solo Pulse [A2]", promptEn: "Describe a pet that belongs to your friend or relative.", promptVi: "Mô tả một thú cưng thuộc về bạn bè hoặc người thân của bạn.", keywords: ["pet", "animals"] },
    { id: 's_a2_34', title: "Solo Pulse [A2]", promptEn: "Talk about how you spend a quiet evening alone at home.", promptVi: "Nói về cách bạn trải qua một buổi tối yên tĩnh một mình ở nhà.", keywords: ["quiet", "evening"] },
    { id: 's_a2_35', title: "Solo Pulse [A2]", promptEn: "Describe an online course or tutorial you enrolled in.", promptVi: "Mô tả một khóa học hoặc bài hướng dẫn trực tuyến bạn đã tham gia.", keywords: ["online course", "study"] },
    { id: 's_a2_36', title: "Solo Pulse [A2]", promptEn: "Talk about a game or puzzle you like playing with family.", promptVi: "Nói về một trò chơi giải đố bạn thích chơi cùng gia đình.", keywords: ["puzzle", "game"] },
    { id: 's_a2_37', title: "Solo Pulse [A2]", promptEn: "Describe a famous landmark in your country's capital.", promptVi: "Mô tả một danh lam thắng cảnh nổi tiếng ở thủ đô nước bạn.", keywords: ["landmark", "capital"] },
    { id: 's_a2_38', title: "Solo Pulse [A2]", promptEn: "Talk about how you plan a weekend picnic with friends.", promptVi: "Nói về cách bạn lên kế hoạch dã ngoại cuối tuần cùng bạn bè.", keywords: ["picnic", "friends"] },
    { id: 's_a2_39', title: "Solo Pulse [A2]", promptEn: "Describe a health habit you practice to avoid getting sick.", promptVi: "Mô tả một thói quen sức khỏe bạn duy trì để không bị ốm.", keywords: ["health", "fitness"] },
    { id: 's_a2_40', title: "Solo Pulse [A2]", promptEn: "Talk about a time you helped a stranger in public.", promptVi: "Nói về một lần bạn giúp đỡ người lạ ở nơi công cộng.", keywords: ["kindness", "help"] },
    { id: 's_a2_41', title: "Solo Pulse [A2]", promptEn: "Describe an interesting souvenir you bought while traveling.", promptVi: "Mô tả một món quà lưu niệm thú vị bạn mua khi đi du lịch.", keywords: ["souvenir", "travel"] },
    { id: 's_a2_42', title: "Solo Pulse [A2]", promptEn: "Talk about a subject you found difficult at school.", promptVi: "Nói về một môn học bạn từng thấy rất khó ở trường.", keywords: ["difficult", "subject"] },
    { id: 's_a2_43', title: "Solo Pulse [A2]", promptEn: "Describe how your city changes during the Tet or holiday season.", promptVi: "Mô tả sự thay đổi của thành phố vào dịp Tết hoặc lễ hội.", keywords: ["holiday", "city"] },
    { id: 's_a2_44', title: "Solo Pulse [A2]", promptEn: "Talk about a photo on your phone that has a special story.", promptVi: "Nói về một bức ảnh trong điện thoại có câu chuyện đặc biệt.", keywords: ["photo", "memory"] },
    { id: 's_a2_45', title: "Solo Pulse [A2]", promptEn: "Describe how you order food online using delivery apps.", promptVi: "Mô tả cách bạn đặt đồ ăn trực tuyến qua ứng dụng giao hàng.", keywords: ["delivery", "app"] },
    { id: 's_a2_46', title: "Solo Pulse [A2]", promptEn: "Talk about a skill you learned from your parents.", promptVi: "Nói về một kỹ năng bạn học được từ bố mẹ.", keywords: ["parents", "skill"] },
    { id: 's_a2_47', title: "Solo Pulse [A2]", promptEn: "Describe your favorite clothing style for job interviews.", promptVi: "Mô tả phong cách ăn mặc yêu thích cho các buổi phỏng vấn.", keywords: ["style", "interview"] },
    { id: 's_a2_48', title: "Solo Pulse [A2]", promptEn: "Talk about a public garden or park you like walking in.", promptVi: "Nói về một khu vườn công cộng bạn thích đi dạo.", keywords: ["garden", "nature"] },
    { id: 's_a2_49', title: "Solo Pulse [A2]", promptEn: "Describe a new electronic device you bought recently.", promptVi: "Mô tả một thiết bị điện tử mới bạn vừa mua gần đây.", keywords: ["device", "tech"] },
    { id: 's_a2_50', title: "Solo Pulse [A2]", promptEn: "Talk about your future travel plans for next year.", promptVi: "Nói về kế hoạch du lịch tương lai của bạn trong năm tới.", keywords: ["travel", "future"] }
  ],
  B1: [
    { id: 's_b1_1', title: "Solo Pulse [B1]", promptEn: "Discuss the advantages and disadvantages of online shopping versus traditional markets.", promptVi: "Thảo luận về ưu nhược điểm của mua sắm trực tuyến so với chợ truyền thống.", keywords: ["e-commerce", "shopping"] },
    { id: 's_b1_2', title: "Solo Pulse [B1]", promptEn: "Analyze the impact of social media on modern personal relationships.", promptVi: "Phân tích tác động của mạng xã hội lên các mối quan hệ cá nhân.", keywords: ["social media", "relationships"] },
    { id: 's_b1_3', title: "Solo Pulse [B1]", promptEn: "Discuss how learning a foreign language influences career opportunities.", promptVi: "Thảo luận việc học ngoại ngữ ảnh hưởng thế nào đến cơ hội nghề nghiệp.", keywords: ["languages", "career"] },
    { id: 's_b1_4', title: "Solo Pulse [B1]", promptEn: "Evaluate the importance of environmental recycling in urban areas.", promptVi: "Đánh giá tầm quan trọng của việc tái chế bảo vệ môi trường.", keywords: ["environment", "recycling"] },
    { id: 's_b1_5', title: "Solo Pulse [B1]", promptEn: "Discuss the balance between work life and personal health for young people.", promptVi: "Thảo luận về sự cân bằng giữa công việc và sức khỏe cá nhân.", keywords: ["work-life balance", "health"] },
    { id: 's_b1_6', title: "Solo Pulse [B1]", promptEn: "Analyze why eco-tourism is becoming popular among global travelers.", promptVi: "Phân tích lý do du lịch sinh thái đang trở nên phổ biến.", keywords: ["tourism", "nature"] },
    { id: 's_b1_7', title: "Solo Pulse [B1]", promptEn: "Discuss how public transport can reduce traffic congestion in big cities.", promptVi: "Thảo luận cách phương tiện công cộng giảm ùn tắc giao thông.", keywords: ["traffic", "transport"] },
    { id: 's_b1_8', title: "Solo Pulse [B1]", promptEn: "Evaluate the effect of fast food consumption on public health.", promptVi: "Đánh giá ảnh hưởng của việc ăn thức ăn nhanh lên sức khỏe.", keywords: ["health", "diet"] },
    { id: 's_b1_9', title: "Solo Pulse [B1]", promptEn: "Discuss the pros and cons of living in a big city compared to a rural area.", promptVi: "Thảo luận ưu nhược điểm của việc sống ở thành phố lớn.", keywords: ["city life", "lifestyle"] },
    { id: 's_b1_10', title: "Solo Pulse [B1]", promptEn: "Analyze the role of traditional music and arts in preserving cultural heritage.", promptVi: "Phân tích vai trò của âm nhạc nghệ thuật truyền thống.", keywords: ["culture", "heritage"] },
    { id: 's_b1_11', title: "Solo Pulse [B1]", promptEn: "Discuss how volunteer work benefits both society and young individuals.", promptVi: "Thảo luận việc làm từ thiện giúp ích gì cho xã hội và giới trẻ.", keywords: ["volunteering", "society"] },
    { id: 's_b1_12', title: "Solo Pulse [B1]", promptEn: "Evaluate the benefits of keeping a personal daily journal or blog.", promptVi: "Đánh giá lợi ích của việc viết nhật ký hoặc blog cá nhân hàng ngày.", keywords: ["writing", "reflection"] },
    { id: 's_b1_13', title: "Solo Pulse [B1]", promptEn: "Discuss how peer pressure affects young adults' career and life decisions.", promptVi: "Thảo luận ảnh hưởng của áp lực đồng lứa lên quyết định của người trẻ.", keywords: ["peer pressure", "youth"] },
    { id: 's_b1_14', title: "Solo Pulse [B1]", promptEn: "Analyze the advantages of working for a small startup versus a large corporation.", promptVi: "Phân tích lợi thế khi làm việc tại startup so với tập đoàn lớn.", keywords: ["startup", "corporation"] },
    { id: 's_b1_15', title: "Solo Pulse [B1]", promptEn: "Discuss the role of sports in fostering teamwork and discipline in children.", promptVi: "Thảo luận vai trò thể thao giúp rèn luyện tính đồng đội cho trẻ em.", keywords: ["sports", "teamwork"] },
    { id: 's_b1_16', title: "Solo Pulse [B1]", promptEn: "Evaluate how streaming platforms have changed movie consumption habits.", promptVi: "Đánh giá nền tảng xem phim trực tuyến thay đổi thói quen giải trí.", keywords: ["streaming", "entertainment"] },
    { id: 's_b1_17', title: "Solo Pulse [B1]", promptEn: "Discuss the impact of climate change on local agricultural food production.", promptVi: "Thảo luận tác động biến đổi khí hậu lên sản xuất nông nghiệp.", keywords: ["climate", "agriculture"] },
    { id: 's_b1_18', title: "Solo Pulse [B1]", promptEn: "Analyze the importance of teaching financial literacy to high school students.", promptVi: "Phân tích tầm quan trọng việc dạy quản lý tài chính cho học sinh.", keywords: ["finance", "education"] },
    { id: 's_b1_19', title: "Solo Pulse [B1]", promptEn: "Discuss the benefits and risks of adopting cashless digital payment systems.", promptVi: "Thảo luận lợi ích và rủi ro của thanh toán không dùng tiền mặt.", keywords: ["cashless", "payment"] },
    { id: 's_b1_20', title: "Solo Pulse [B1]", promptEn: "Evaluate the role of museums and historic sites in modern education.", promptVi: "Đánh giá vai trò của bảo tàng và di tích lịch sử đối với giáo dục.", keywords: ["museum", "history"] },
    { id: 's_b1_21', title: "Solo Pulse [B1]", promptEn: "Discuss how plastic pollution affects ocean marine life and fishing industries.", promptVi: "Thảo luận ô nhiễm nhựa ảnh hưởng thế nào đến sinh vật biển.", keywords: ["pollution", "ocean"] },
    { id: 's_b1_22', title: "Solo Pulse [B1]", promptEn: "Analyze the effects of working remotely on employee mental well-being.", promptVi: "Phân tích ảnh hưởng của làm việc từ xa lên sức khỏe tinh thần.", keywords: ["remote work", "mental health"] },
    { id: 's_b1_23', title: "Solo Pulse [B1]", promptEn: "Discuss why lifelong learning is essential in today's changing job market.", promptVi: "Thảo luận lý do việc học tập suốt đời là yếu tố bắt buộc hiện nay.", keywords: ["lifelong learning", "career"] },
    { id: 's_b1_24', title: "Solo Pulse [B1]", promptEn: "Evaluate the pros and cons of studying abroad versus studying locally.", promptVi: "Đánh giá ưu nhược điểm của du học so với học trong nước.", keywords: ["study abroad", "education"] },
    { id: 's_b1_25', title: "Solo Pulse [B1]", promptEn: "Discuss the impact of influencer advertising on youth spending habits.", promptVi: "Thảo luận tác động của quảng cáo KOL lên thói quen chi tiêu giới trẻ.", keywords: ["influencer", "advertising"] },
    { id: 's_b1_26', title: "Solo Pulse [B1]", promptEn: "Analyze how public libraries are adapting to the digital age.", promptVi: "Phân tích cách các thư viện công cộng thích ứng với thời đại số.", keywords: ["library", "digital"] },
    { id: 's_b1_27', title: "Solo Pulse [B1]", promptEn: "Discuss the importance of preserving minority languages and dialects.", promptVi: "Thảo luận tầm quan trọng của việc bảo tồn tiếng nói dân tộc thiểu số.", keywords: ["minority language", "culture"] },
    { id: 's_b1_28', title: "Solo Pulse [B1]", promptEn: "Evaluate the benefits of urban rooftop gardening in crowded cities.", promptVi: "Đánh giá lợi ích của việc trồng cây trên sân thượng ở thành phố.", keywords: ["gardening", "urban"] },
    { id: 's_b1_29', title: "Solo Pulse [B1]", promptEn: "Discuss the role of artificial intelligence in personalized student learning.", promptVi: "Thảo luận vai trò của trí tuệ nhân tạo trong cá nhân hóa học tập.", keywords: ["AI", "education"] },
    { id: 's_b1_30', title: "Solo Pulse [B1]", promptEn: "Analyze the causes of sleep deprivation among modern university students.", promptVi: "Phân tích nguyên nhân dẫn đến thiếu ngủ ở sinh viên đại học.", keywords: ["sleep", "students"] },
    { id: 's_b1_31', title: "Solo Pulse [B1]", promptEn: "Discuss the benefits of public art installations in urban spaces.", promptVi: "Thảo luận lợi ích của các tác phẩm nghệ thuật công cộng.", keywords: ["public art", "city"] },
    { id: 's_b1_32', title: "Solo Pulse [B1]", promptEn: "Evaluate the impact of fast-fashion trends on environmental pollution.", promptVi: "Đánh giá tác động của xu hướng thời trang nhanh lên ô nhiễm.", keywords: ["fast fashion", "environment"] },
    { id: 's_b1_33', title: "Solo Pulse [B1]", promptEn: "Discuss how video games can improve problem-solving skills in teens.", promptVi: "Thảo luận việc chơi game cải thiện kỹ năng giải quyết vấn đề.", keywords: ["video games", "skills"] },
    { id: 's_b1_34', title: "Solo Pulse [B1]", promptEn: "Analyze the effectiveness of recycling programs in local schools.", promptVi: "Phân tích tính hiệu quả của các chương trình tái chế ở trường học.", keywords: ["recycling", "school"] },
    { id: 's_b1_35', title: "Solo Pulse [B1]", promptEn: "Discuss the pros and cons of living in a co-working or co-living space.", promptVi: "Thảo luận ưu nhược điểm của không gian chia sẻ làm việc/sinh sống.", keywords: ["co-living", "sharing economy"] },
    { id: 's_b1_36', title: "Solo Pulse [B1]", promptEn: "Evaluate how smartphones affect family conversations during dinner.", promptVi: "Đánh giá ảnh hưởng điện thoại lên giao tiếp trong bữa ăn gia đình.", keywords: ["smartphones", "family"] },
    { id: 's_b1_37', title: "Solo Pulse [B1]", promptEn: "Discuss the challenges faced by local small businesses during economic inflation.", promptVi: "Thảo luận thử thách của doanh nghiệp nhỏ trong thời kỳ lạm phát.", keywords: ["small business", "inflation"] },
    { id: 's_b1_38', title: "Solo Pulse [B1]", promptEn: "Analyze the role of animal welfare organizations in urban pet care.", promptVi: "Phân tích vai trò của tổ chức bảo vệ động vật đối với thú cưng.", keywords: ["animal welfare", "pets"] },
    { id: 's_b1_39', title: "Solo Pulse [B1]", promptEn: "Discuss the importance of soft skills like communication in job seeking.", promptVi: "Thảo luận tầm quan trọng kỹ năng mềm khi tìm kiếm việc làm.", keywords: ["soft skills", "job search"] },
    { id: 's_b1_40', title: "Solo Pulse [B1]", promptEn: "Evaluate how renewable solar energy can reduce household electric bills.", promptVi: "Đánh giá cách năng lượng mặt trời giảm chi phí điện gia đình.", keywords: ["solar energy", "household"] },
    { id: 's_b1_41', title: "Solo Pulse [B1]", promptEn: "Discuss the impact of screen time on young children's eye health.", promptVi: "Thảo luận tác động của thời gian nhìn màn hình lên thị lực trẻ em.", keywords: ["screen time", "eye health"] },
    { id: 's_b1_42', title: "Solo Pulse [B1]", promptEn: "Analyze why traditional handicrafts are regaining popularity in modern markets.", promptVi: "Phân tích lý do đồ thủ công truyền thống đang phục hồi sức hút.", keywords: ["handicrafts", "tradition"] },
    { id: 's_b1_43', title: "Solo Pulse [B1]", promptEn: "Discuss the benefits of bicycle sharing programs in major tourist cities.", promptVi: "Thảo luận lợi ích của mô hình xe đạp công cộng ở thành phố du lịch.", keywords: ["bike sharing", "tourism"] },
    { id: 's_b1_44', title: "Solo Pulse [B1]", promptEn: "Evaluate the role of social media in spreading environmental awareness.", promptVi: "Đánh giá vai trò mạng xã hội trong lan tỏa ý thức môi trường.", keywords: ["social media", "awareness"] },
    { id: 's_b1_45', title: "Solo Pulse [B1]", promptEn: "Discuss the challenges of maintaining work-life boundaries in hybrid work.", promptVi: "Thảo luận thử thách duy trì ranh giới công việc khi làm việc hybrid.", keywords: ["hybrid work", "balance"] },
    { id: 's_b1_46', title: "Solo Pulse [B1]", promptEn: "Analyze how public health campaigns promote daily physical exercise.", promptVi: "Phân tích cách các chiến dịch y tế thúc đẩy rèn luyện thể chất.", keywords: ["public health", "exercise"] },
    { id: 's_b1_47', title: "Solo Pulse [B1]", promptEn: "Discuss the importance of financial budgeting for young independent adults.", promptVi: "Thảo luận tầm quan trọng của việc lập ngân sách tài chính cá nhân.", keywords: ["budgeting", "financial independence"] },
    { id: 's_b1_48', title: "Solo Pulse [B1]", promptEn: "Evaluate the pros and cons of banning cars in city center shopping streets.", promptVi: "Đánh giá ưu nhược điểm của việc cấm ô tô ở phố đi bộ mua sắm.", keywords: ["car-free", "urban"] },
    { id: 's_b1_49', title: "Solo Pulse [B1]", promptEn: "Discuss how cultural exchange programs foster global peace and tolerance.", promptVi: "Thảo luận chương trình giao lưu văn hóa thúc đẩy hòa bình thế giới.", keywords: ["cultural exchange", "peace"] },
    { id: 's_b1_50', title: "Solo Pulse [B1]", promptEn: "Analyze the benefits of mental health days off in modern corporate policies.", promptVi: "Phân tích lợi ích của ngày nghỉ chăm sóc sức khỏe tinh thần.", keywords: ["mental health", "corporate policy"] }
  ],
  B2: [
    { id: 's_b2_1', title: "Solo Pulse [B2]", promptEn: "Analyze the ethical implications of automated algorithms in targeted commercial advertising.", keywords: ["algorithms", "ethics"] },
    { id: 's_b2_2', title: "Solo Pulse [B2]", promptEn: "Evaluate the environmental impact of global fast-fashion production and supply chains.", keywords: ["fast fashion", "sustainability"] },
    { id: 's_b2_3', title: "Solo Pulse [B2]", promptEn: "Discuss the influence of artificial intelligence on future employment opportunities.", keywords: ["AI", "employment"] },
    { id: 's_b2_4', title: "Solo Pulse [B2]", promptEn: "Examine the role of renewable energy adoption in mitigating climate change risks.", keywords: ["renewable energy", "climate"] },
    { id: 's_b2_5', title: "Solo Pulse [B2]", promptEn: "Critique the psychological impact of constant notification cycles on human attention spans.", keywords: ["psychology", "technology"] },
    { id: 's_b2_6', title: "Solo Pulse [B2]", promptEn: "Analyze how digital currencies could transform traditional banking infrastructures.", keywords: ["fintech", "banking"] },
    { id: 's_b2_7', title: "Solo Pulse [B2]", promptEn: "Discuss the ethical responsibilities of media outlets in curbing misinformation.", keywords: ["journalism", "ethics"] },
    { id: 's_b2_8', title: "Solo Pulse [B2]", promptEn: "Evaluate the effectiveness of remote working models on corporate innovation.", keywords: ["remote work", "innovation"] },
    { id: 's_b2_9', title: "Solo Pulse [B2]", promptEn: "Examine the socio-economic effects of urbanization on developing economies.", keywords: ["urbanization", "economics"] },
    { id: 's_b2_10', title: "Solo Pulse [B2]", promptEn: "Discuss the regulatory challenges posed by autonomous self-driving vehicles.", keywords: ["autonomous vehicles", "regulation"] },
    { id: 's_b2_11', title: "Solo Pulse [B2]", promptEn: "Analyze the implications of genetic testing technologies on personal privacy rights.", keywords: ["biotech", "privacy"] },
    { id: 's_b2_12', title: "Solo Pulse [B2]", promptEn: "Critique the growing reliance on gig-economy platforms for sustainable livelihood.", keywords: ["gig economy", "labor"] },
    { id: 's_b2_13', title: "Solo Pulse [B2]", promptEn: "Evaluate the effectiveness of international carbon credit offset frameworks.", keywords: ["carbon credits", "sustainability"] },
    { id: 's_b2_14', title: "Solo Pulse [B2]", promptEn: "Examine the influence of influencer culture on consumer spending behaviors.", keywords: ["consumerism", "influencers"] },
    { id: 's_b2_15', title: "Solo Pulse [B2]", promptEn: "Discuss the ethics of automated facial recognition deployment in public spaces.", keywords: ["surveillance", "privacy"] },
    { id: 's_b2_16', title: "Solo Pulse [B2]", promptEn: "Analyze the impact of commercial space tourism on atmospheric protection policies.", keywords: ["space tourism", "aerospace"] },
    { id: 's_b2_17', title: "Solo Pulse [B2]", promptEn: "Evaluate how smart city urban design can improve public health resilience.", keywords: ["smart cities", "urban planning"] },
    { id: 's_b2_18', title: "Solo Pulse [B2]", promptEn: "Examine the challenges of managing electronic waste from consumer technology.", keywords: ["e-waste", "sustainability"] },
    { id: 's_b2_19', title: "Solo Pulse [B2]", promptEn: "Discuss the economic risks associated with over-tourism in heritage destinations.", keywords: ["overtourism", "economics"] },
    { id: 's_b2_20', title: "Solo Pulse [B2]", promptEn: "Analyze the role of global multilateral organizations in mitigating trade wars.", keywords: ["trade", "geopolitics"] },
    { id: 's_b2_21', title: "Solo Pulse [B2]", promptEn: "Evaluate the impact of artificial intelligence on creative intellectual property rights.", keywords: ["AI", "copyright"] },
    { id: 's_b2_22', title: "Solo Pulse [B2]", promptEn: "Discuss the ethical dilemmas surrounding mandatory workplace biometric tracking.", keywords: ["biometrics", "workplace"] },
    { id: 's_b2_23', title: "Solo Pulse [B2]", promptEn: "Analyze how microplastic accumulation threatens global marine food chains.", keywords: ["microplastics", "marine ecology"] },
    { id: 's_b2_24', title: "Solo Pulse [B2]", promptEn: "Critique the effectiveness of corporate greenwashing in voluntary ESG reports.", keywords: ["greenwashing", "ESG"] },
    { id: 's_b2_25', title: "Solo Pulse [B2]", promptEn: "Examine the social consequences of gentrification in historic urban neighborhoods.", keywords: ["gentrification", "sociology"] },
    { id: 's_b2_26', title: "Solo Pulse [B2]", promptEn: "Discuss the viability of hydrogen fuel cells compared to battery electric vehicles.", keywords: ["clean tech", "transportation"] },
    { id: 's_b2_27', title: "Solo Pulse [B2]", promptEn: "Analyze the psychological effects of algorithmic social media addiction on teenagers.", keywords: ["algorithms", "psychology"] },
    { id: 's_b2_28', title: "Solo Pulse [B2]", promptEn: "Evaluate the role of central banks in managing digital currency inflation volatility.", keywords: ["central banking", "inflation"] },
    { id: 's_b2_29', title: "Solo Pulse [B2]", promptEn: "Discuss the ethical limits of gene-editing techniques in agricultural livestock.", keywords: ["gene editing", "ethics"] },
    { id: 's_b2_30', title: "Solo Pulse [B2]", promptEn: "Examine the economic challenges of transitioning from fossil fuel subsidies to renewables.", keywords: ["subsidies", "energy transition"] },
    { id: 's_b2_31', title: "Solo Pulse [B2]", promptEn: "Analyze how big data predictive analytics influence modern political campaigns.", keywords: ["big data", "politics"] },
    { id: 's_b2_32', title: "Solo Pulse [B2]", promptEn: "Evaluate the effectiveness of congestion pricing policies in high-density capitals.", keywords: ["congestion pricing", "urban transport"] },
    { id: 's_b2_33', title: "Solo Pulse [B2]", promptEn: "Discuss the risks of deepsea mining on undisturbed benthic ocean ecosystems.", keywords: ["deepsea mining", "ecology"] },
    { id: 's_b2_34', title: "Solo Pulse [B2]", promptEn: "Critique the commodification of wellness trends in modern consumer culture.", keywords: ["wellness", "consumerism"] },
    { id: 's_b2_35', title: "Solo Pulse [B2]", promptEn: "Examine the socio-economic benefits of adopting a universal four-day workweek.", keywords: ["four-day workweek", "labor"] },
    { id: 's_b2_36', title: "Solo Pulse [B2]", promptEn: "Analyze how open-source software development reshapes corporate tech monopolies.", keywords: ["open source", "monopoly"] },
    { id: 's_b2_37', title: "Solo Pulse [B2]", promptEn: "Evaluate the ethical responsibilities of tech platforms in removing hate speech.", keywords: ["content moderation", "free speech"] },
    { id: 's_b2_38', title: "Solo Pulse [B2]", promptEn: "Discuss the impact of nuclear energy micro-reactors on regional power grids.", keywords: ["nuclear energy", "power grid"] },
    { id: 's_b2_39', title: "Solo Pulse [B2]", promptEn: "Examine the challenges of implementing universal digital identity frameworks.", keywords: ["digital ID", "cybersecurity"] },
    { id: 's_b2_40', title: "Solo Pulse [B2]", promptEn: "Analyze how lab-grown cultivated meat could disrupt global livestock farming.", keywords: ["lab-grown meat", "agriculture"] },
    { id: 's_b2_41', title: "Solo Pulse [B2]", promptEn: "Evaluate the legal jurisprudence surrounding remote worker surveillance software.", keywords: ["surveillance", "labor rights"] },
    { id: 's_b2_42', title: "Solo Pulse [B2]", promptEn: "Discuss the impact of fast-fashion synthetic fibers on microplastic ocean pollution.", keywords: ["textiles", "pollution"] },
    { id: 's_b2_43', title: "Solo Pulse [B2]", promptEn: "Critique the effectiveness of carbon border adjustment tariffs on global trade.", keywords: ["carbon tax", "international trade"] },
    { id: 's_b2_44', title: "Solo Pulse [B2]", promptEn: "Examine the psychological effects of immersive virtual reality on human empathy.", keywords: ["virtual reality", "psychology"] },
    { id: 's_b2_45', title: "Solo Pulse [B2]", promptEn: "Analyze how algorithmic pricing in housing rental markets inflates living costs.", keywords: ["proptech", "housing crisis"] },
    { id: 's_b2_46', title: "Solo Pulse [B2]", promptEn: "Evaluate the ethical implications of commercializing private human spaceflight.", keywords: ["commercial space", "ethics"] },
    { id: 's_b2_47', title: "Solo Pulse [B2]", promptEn: "Discuss the role of decentralized finance protocols in mitigating traditional bank runs.", keywords: ["DeFi", "banking"] },
    { id: 's_b2_48', title: "Solo Pulse [B2]", promptEn: "Examine the impact of automated algorithmic trading on equity market flash crashes.", keywords: ["high-frequency trading", "finance"] },
    { id: 's_b2_49', title: "Solo Pulse [B2]", promptEn: "Analyze the effectiveness of global treaties in curbing orbital space debris hazards.", keywords: ["space debris", "treaties"] },
    { id: 's_b2_50', title: "Solo Pulse [B2]", promptEn: "Critique the role of dark pattern UI designs in manipulating online consumer choices.", keywords: ["dark patterns", "UX ethics"] }
  ],
  C1: [
    { id: 's_c1_1', title: "Solo Pulse [C1]", promptEn: "Evaluate the impact of macroeconomic inflation on global supply chain resilience.", keywords: ["macroeconomics", "supply chain"] },
    { id: 's_c1_2', title: "Solo Pulse [C1]", promptEn: "Deconstruct the geopolitical challenges of regulating international cyberspace conflicts.", keywords: ["geopolitics", "cybersecurity"] },
    { id: 's_c1_3', title: "Solo Pulse [C1]", promptEn: "Analyze the socio-economic repercussions of demographic aging in industrialized nations.", keywords: ["demographics", "economy"] },
    { id: 's_c1_4', title: "Solo Pulse [C1]", promptEn: "Critique the efficacy of carbon tax policies in incentivizing corporate decarbonization.", keywords: ["carbon tax", "decarbonization"] },
    { id: 's_c1_5', title: "Solo Pulse [C1]", promptEn: "Examine the philosophical boundary between human cognitive autonomy and AI augmentation.", keywords: ["cognition", "philosophy"] },
    { id: 's_c1_6', title: "Solo Pulse [C1]", promptEn: "Evaluate the resilience of democratic institutions in an era of algorithmic polarizations.", keywords: ["democracy", "polarization"] },
    { id: 's_c1_7', title: "Solo Pulse [C1]", promptEn: "Deconstruct the legal tensions surrounding patent monopolies in global pharmaceutical research.", keywords: ["intellectual property", "pharma"] },
    { id: 's_c1_8', title: "Solo Pulse [C1]", promptEn: "Analyze the impact of central bank digital currencies on global monetary sovereignty.", keywords: ["CBDC", "monetary policy"] },
    { id: 's_c1_9', title: "Solo Pulse [C1]", promptEn: "Critique the commodification of private data in modern platform capitalism.", keywords: ["surveillance capitalism", "privacy"] },
    { id: 's_c1_10', title: "Solo Pulse [C1]", promptEn: "Examine the ethical considerations of CRISPR gene editing in preventative healthcare.", keywords: ["biotechnology", "gene editing"] },
    { id: 's_c1_11', title: "Solo Pulse [C1]", promptEn: "Evaluate the structural shift toward multipolar trade alignments amidst geopolitical tensions.", keywords: ["multipolarity", "trade"] },
    { id: 's_c1_12', title: "Solo Pulse [C1]", promptEn: "Deconstruct the psychological mechanisms of echo-chamber formation in digital news networks.", keywords: ["echo chambers", "epistemology"] },
    { id: 's_c1_13', title: "Solo Pulse [C1]", promptEn: "Analyze the legal frameworks governing deepfake technology and intellectual property protection.", keywords: ["deepfakes", "jurisprudence"] },
    { id: 's_c1_14', title: "Solo Pulse [C1]", promptEn: "Critique the socio-economic disparities exacerbated by rapid technological automation in agriculture.", keywords: ["agritech", "disparity"] },
    { id: 's_c1_15', title: "Solo Pulse [C1]", promptEn: "Examine the efficacy of geoengineering solar radiation management as a temporary climate intervention.", keywords: ["geoengineering", "climate"] },
    { id: 's_c1_16', title: "Solo Pulse [C1]", promptEn: "Evaluate the impact of algorithmic high-frequency trading on global financial market stability.", keywords: ["algorithmic trading", "finance"] },
    { id: 's_c1_17', title: "Solo Pulse [C1]", promptEn: "Deconstruct the ethics of automated military drone systems operating under decentralized decision trees.", keywords: ["military AI", "ethics"] },
    { id: 's_c1_18', title: "Solo Pulse [C1]", promptEn: "Analyze the erosion of traditional labor rights within decentralized global remote work contracts.", keywords: ["labor law", "globalization"] },
    { id: 's_c1_19', title: "Solo Pulse [C1]", promptEn: "Critique the institutional governance mechanisms mitigating water scarcity disputes in transboundary basins.", keywords: ["water rights", "governance"] },
    { id: 's_c1_20', title: "Solo Pulse [C1]", promptEn: "Examine the legal jurisprudence surrounding neural privacy and brain-computer interface telemetry data.", keywords: ["neurotech", "jurisprudence"] },
    { id: 's_c1_21', title: "Solo Pulse [C1]", promptEn: "Deconstruct the geopolitical risks of rare-earth mineral monopolies in renewable energy hardware.", keywords: ["rare earths", "supply chain"] },
    { id: 's_c1_22', title: "Solo Pulse [C1]", promptEn: "Evaluate the effectiveness of supranational legal tribunals in enforcing ecocide accountability.", keywords: ["ecocide", "international law"] },
    { id: 's_c1_23', title: "Solo Pulse [C1]", promptEn: "Analyze the socio-economic consequences of central bank balance sheet quantitative tightening.", keywords: ["quantitative tightening", "macroeconomics"] },
    { id: 's_c1_24', title: "Solo Pulse [C1]", promptEn: "Critique the institutional fragility of global multilateral cybersecurity response treaties.", keywords: ["cyber warfare", "diplomacy"] },
    { id: 's_c1_25', title: "Solo Pulse [C1]", promptEn: "Examine the ethical dilemmas of using predictive AI algorithms in criminal justice sentencing.", keywords: ["predictive justice", "AI ethics"] },
    { id: 's_c1_26', title: "Solo Pulse [C1]", promptEn: "Evaluate the impact of sovereign wealth fund investments on foreign critical infrastructure.", keywords: ["sovereign wealth", "infrastructure"] },
    { id: 's_c1_27', title: "Solo Pulse [C1]", promptEn: "Deconstruct the systemic vulnerabilities of subsea telecommunications cables in hybrid conflict.", keywords: ["subsea cables", "telecom security"] },
    { id: 's_c1_28', title: "Solo Pulse [C1]", promptEn: "Analyze how algorithmic news curation reshapes political consensus in parliamentary democracies.", keywords: ["media curation", "democracy"] },
    { id: 's_c1_29', title: "Solo Pulse [C1]", promptEn: "Critique the carbon accounting methodologies used in corporate net-zero pledge claims.", keywords: ["net-zero", "carbon accounting"] },
    { id: 's_c1_30', title: "Solo Pulse [C1]", promptEn: "Examine the legal challenges of regulating decentralized autonomous organizations across jurisdictions.", keywords: ["DAO", "jurisprudence"] },
    { id: 's_c1_31', title: "Solo Pulse [C1]", promptEn: "Evaluate the impact of pharmaceutical patent waiving on global vaccine innovation incentives.", keywords: ["pharma patents", "global health"] },
    { id: 's_c1_32', title: "Solo Pulse [C1]", promptEn: "Deconstruct the socio-linguistic homogenisation driven by dominant generative language models.", keywords: ["linguistic erosion", "generative AI"] },
    { id: 's_c1_33', title: "Solo Pulse [C1]", promptEn: "Analyze the economic stability risks of non-bank financial intermediation shadow banking systems.", keywords: ["shadow banking", "systemic risk"] },
    { id: 's_c1_34', title: "Solo Pulse [C1]", promptEn: "Critique the thermodynamic limitations of planet-scale quantum computing energy requirements.", keywords: ["quantum computing", "thermodynamics"] },
    { id: 's_c1_35', title: "Solo Pulse [C1]", promptEn: "Examine the ethical implications of using synthetic biological organisms for environmental remediation.", keywords: ["synthetic biology", "bioethics"] },
    { id: 's_c1_36', title: "Solo Pulse [C1]", promptEn: "Evaluate the effectiveness of international trade sanctions in deterring territorial aggression.", keywords: ["sanctions", "geopolitics"] },
    { id: 's_c1_37', title: "Solo Pulse [C1]", promptEn: "Deconstruct the psychological impact of automated biometric surveillance in urban transit hubs.", keywords: ["surveillance", "urban psychology"] },
    { id: 's_c1_38', title: "Solo Pulse [C1]", promptEn: "Analyze the governance paradoxes of managing extra-terrestrial satellite constellation orbital traffic.", keywords: ["satellite constellation", "space law"] },
    { id: 's_c1_39', title: "Solo Pulse [C1]", promptEn: "Critique the socio-economic impacts of automated algorithmic debt collection in low-income sectors.", keywords: ["algorithmic bias", "poverty"] },
    { id: 's_c1_40', title: "Solo Pulse [C1]", promptEn: "Examine the legal frameworks governing neural data privacy in commercial brain-computer interfaces.", keywords: ["neuro-privacy", "BCI"] },
    { id: 's_c1_41', title: "Solo Pulse [C1]", promptEn: "Evaluate the impact of deglobalization trends on multinational corporate tax compliance strategies.", keywords: ["deglobalization", "tax compliance"] },
    { id: 's_c1_42', title: "Solo Pulse [C1]", promptEn: "Deconstruct the ethical trade-offs between automated agricultural yield optimization and biodiversity.", keywords: ["agritech", "biodiversity"] },
    { id: 's_c1_43', title: "Solo Pulse [C1]", promptEn: "Analyze the role of supranational sovereign wealth funds in funding green infrastructure bonds.", keywords: ["green bonds", "sovereign funds"] },
    { id: 's_c1_44', title: "Solo Pulse [C1]", promptEn: "Critique the institutional limits of global pandemic response treaties under sovereign health mandates.", keywords: ["global health", "sovereignty"] },
    { id: 's_c1_45', title: "Solo Pulse [C1]", promptEn: "Examine the legal jurisprudence governing liability for autonomous AI decision-making in aviation.", keywords: ["autonomous aviation", "tort law"] },
    { id: 's_c1_46', title: "Solo Pulse [C1]", promptEn: "Evaluate the socio-economic effects of centralizing cloud computing infrastructure in three tech monopolies.", keywords: ["cloud monopoly", "tech infrastructure"] },
    { id: 's_c1_47', title: "Solo Pulse [C1]", promptEn: "Deconstruct the epistemological shift in scientific research generated by deep learning protein folding models.", keywords: ["deep learning", "proteomics"] },
    { id: 's_c1_48', title: "Solo Pulse [C1]", promptEn: "Analyze the impact of automated content moderation algorithms on political speech censorship.", keywords: ["content moderation", "free speech"] },
    { id: 's_c1_49', title: "Solo Pulse [C1]", promptEn: "Critique the financial sustainability of sovereign debt relief mechanisms in climate-vulnerable island states.", keywords: ["sovereign debt", "climate vulnerability"] },
    { id: 's_c1_50', title: "Solo Pulse [C1]", promptEn: "Examine the ethical implications of commercializing cognitive enhancement pharmaceuticals in academia.", keywords: ["nootropics", "academic ethics"] }
  ],
  C2: [
    { id: 's_c2_1', title: "Solo Pulse [C2]", promptEn: "Critically deconstruct the epistemological paradigm shift induced by generative AI in scientific research.", keywords: ["epistemology", "generative AI"] },
    { id: 's_c2_2', title: "Solo Pulse [C2]", promptEn: "Analyze the tension between national sovereignty and supranational climate governance frameworks.", keywords: ["sovereignty", "governance"] },
    { id: 's_c2_3', title: "Solo Pulse [C2]", promptEn: "Evaluate the ontological implications of artificial consciousness on human moral standing.", keywords: ["ontology", "ethics"] },
    { id: 's_c2_4', title: "Solo Pulse [C2]", promptEn: "Deconstruct the structural fragilities of globalized financial derivatives markets during geopolitical crises.", keywords: ["financial markets", "derivatives"] },
    { id: 's_c2_5', title: "Solo Pulse [C2]", promptEn: "Critique the discourse of techno-solutionism in addressing systemic socio-ecological degradation.", keywords: ["techno-solutionism", "ecology"] },
    { id: 's_c2_6', title: "Solo Pulse [C2]", promptEn: "Analyze the jurisprudence surrounding extraterritorial corporate accountability in transnational supply chains.", keywords: ["jurisprudence", "human rights"] },
    { id: 's_c2_7', title: "Solo Pulse [C2]", promptEn: "Deconstruct the socio-linguistic erosion of regional dialects under corporate language homogenization.", keywords: ["linguistics", "homogenization"] },
    { id: 's_c2_8', title: "Solo Pulse [C2]", promptEn: "Evaluate the thermodynamic limits of exponential computational growth in quantum systems.", keywords: ["thermodynamics", "quantum"] },
    { id: 's_c2_9', title: "Solo Pulse [C2]", promptEn: "Critique the institutional inertia preventing radical reform in multilateral international organizations.", keywords: ["multilateralism", "institutionalism"] },
    { id: 's_c2_10', title: "Solo Pulse [C2]", promptEn: "Analyze the existential implications of post-humanist philosophies on bioethical frameworks.", keywords: ["post-humanism", "bioethics"] },
    { id: 's_c2_11', title: "Solo Pulse [C2]", promptEn: "Deconstruct the structural paradoxes of fiat monetary expansion within finite ecological systems.", keywords: ["monetary theory", "ecology"] },
    { id: 's_c2_12', title: "Solo Pulse [C2]", promptEn: "Critically analyze the epistemological validity of synthetic data in training autonomous decision engines.", keywords: ["synthetic data", "epistemology"] },
    { id: 's_c2_13', title: "Solo Pulse [C2]", promptEn: "Evaluate the legal jurisprudence governing corporate liability for automated algorithmic market collusion.", keywords: ["antitrust", "jurisprudence"] },
    { id: 's_c2_14', title: "Solo Pulse [C2]", promptEn: "Deconstruct the socio-political ramifications of de-dollarization in multipolar international financial clearing.", keywords: ["de-dollarization", "geopolitics"] },
    { id: 's_c2_15', title: "Solo Pulse [C2]", promptEn: "Critique the philosophical assumptions underpinning techno-capitalist paradigms of continuous economic growth.", keywords: ["techno-capitalism", "philosophy"] },
    { id: 's_c2_16', title: "Solo Pulse [C2]", promptEn: "Analyze the legal and moral status of synthetic biological organisms engineered for industrial bioremediation.", keywords: ["synthetic biology", "ethics"] },
    { id: 's_c2_17', title: "Solo Pulse [C2]", promptEn: "Evaluate the systemic vulnerabilities of subsea fiber-optic communication backbones in modern hybrid warfare.", keywords: ["infrastructure", "cyberwarfare"] },
    { id: 's_c2_18', title: "Solo Pulse [C2]", promptEn: "Deconstruct the jurisprudence of extraterritorial carbon border adjustments under WTO non-discrimination mandates.", keywords: ["WTO", "jurisprudence"] },
    { id: 's_c2_19', title: "Solo Pulse [C2]", promptEn: "Critically assess the thermodynamic scalability of planetary-scale direct air carbon capture infrastructure.", keywords: ["carbon capture", "thermodynamics"] },
    { id: 's_c2_20', title: "Solo Pulse [C2]", promptEn: "Analyze the ontological reframing of human agency in fully automated algorithmic governance frameworks.", keywords: ["agency", "algorithmic governance"] },
    { id: 's_c2_21', title: "Solo Pulse [C2]", promptEn: "Critically deconstruct the bio-political jurisprudence of sovereign state emergency health decrees.", keywords: ["biopolitics", "jurisprudence"] },
    { id: 's_c2_22', title: "Solo Pulse [C2]", promptEn: "Analyze the thermodynamic implications of planet-scale neural network training on regional energy grids.", keywords: ["thermodynamics", "AI energy"] },
    { id: 's_c2_23', title: "Solo Pulse [C2]", promptEn: "Evaluate the epistemological degradation of objective truth in post-truth digital archive environments.", keywords: ["epistemology", "digital archives"] },
    { id: 's_c2_24', title: "Solo Pulse [C2]", promptEn: "Deconstruct the legal doctrine of non-appropriation in commercial lunar regolith mining concessions.", keywords: ["space law", "Regolith"] },
    { id: 's_c2_25', title: "Solo Pulse [C2]", promptEn: "Critique the ethical coherence of granting legal personhood status to decentralized autonomous neural entities.", keywords: ["legal personhood", "AI ethics"] },
    { id: 's_c2_26', title: "Solo Pulse [C2]", promptEn: "Analyze the structural instabilities of supranational currency unions lacking unified fiscal transfer mechanisms.", keywords: ["fiscal policy", "monetary union"] },
    { id: 's_c2_27', title: "Solo Pulse [C2]", promptEn: "Deconstruct the socio-linguistic erosion generated by corporate standardized machine translation protocols.", keywords: ["linguistics", "machine translation"] },
    { id: 's_c2_28', title: "Solo Pulse [C2]", promptEn: "Evaluate the jurisprudence of universal jurisdiction in prosecuting corporate ecocide across borders.", keywords: ["ecocide", "jurisprudence"] },
    { id: 's_c2_29', title: "Solo Pulse [C2]", promptEn: "Critique the discourse of techno-solutionism in mitigating planetary-scale biodiversity collapses.", keywords: ["techno-solutionism", "biodiversity"] },
    { id: 's_c2_30', title: "Solo Pulse [C2]", promptEn: "Analyze the ontological status of synthetic organoid intelligence models operating under biological neural substrate.", keywords: ["organoid intelligence", "ontology"] },
    { id: 's_c2_31', title: "Solo Pulse [C2]", promptEn: "Deconstruct the thermodynamic limits of perpetual economic growth within closed terrestrial ecosystems.", keywords: ["thermodynamics", "ecological economics"] },
    { id: 's_c2_32', title: "Solo Pulse [C2]", promptEn: "Critically analyze the legal accountability frameworks for collateral damage in fully autonomous algorithmic warfare.", keywords: ["autonomous warfare", "international humanitarian law"] },
    { id: 's_c2_33', title: "Solo Pulse [C2]", promptEn: "Evaluate the systemic vulnerabilities of central bank digital currencies to state-sponsored quantum decryption.", keywords: ["CBDC", "quantum cryptography"] },
    { id: 's_c2_34', title: "Solo Pulse [C2]", promptEn: "Deconstruct the bio-ethical implications of commercial human germline genetic enhancement treaties.", keywords: ["germline editing", "bioethics"] },
    { id: 's_c2_35', title: "Solo Pulse [C2]", promptEn: "Analyze the socio-political ramifications of de-territorialized sovereign digital identity systems.", keywords: ["sovereignty", "digital identity"] },
    { id: 's_c2_36', title: "Solo Pulse [C2]", promptEn: "Critique the epistemological validity of black-box deep neural decision systems in high-stakes judicial trials.", keywords: ["black-box AI", "jurisprudence"] },
    { id: 's_c2_37', title: "Solo Pulse [C2]", promptEn: "Evaluate the impact of supranational carbon border adjustments on global south industrial sovereignty.", keywords: ["carbon border tax", "global south"] },
    { id: 's_c2_38', title: "Solo Pulse [C2]", promptEn: "Deconstruct the structural fragilities of globalized sovereign debt restructuring under bilateral clearing.", keywords: ["sovereign debt", "geopolitics"] },
    { id: 's_c2_39', title: "Solo Pulse [C2]", promptEn: "Analyze the philosophical assumptions underpinning post-scarcity economic allocation models in AI economies.", keywords: ["post-scarcity", "economic philosophy"] },
    { id: 's_c2_40', title: "Solo Pulse [C2]", promptEn: "Critique the institutional limits of multilateral governance in enforcing orbital space debris mitigation treaties.", keywords: ["space debris", "governance"] },
    { id: 's_c2_41', title: "Solo Pulse [C2]", promptEn: "Deconstruct the biopolitical governance of human neural data telemetry harvested via commercial BCI devices.", keywords: ["neuro-telemetry", "biopolitics"] },
    { id: 's_c2_42', title: "Solo Pulse [C2]", promptEn: "Analyze the legal jurisprudence governing liability for algorithmic high-frequency trading flash-crash contagion.", keywords: ["high-frequency trading", "financial jurisprudence"] },
    { id: 's_c2_43', title: "Solo Pulse [C2]", promptEn: "Evaluate the thermodynamic efficiency of solar radiation geoengineering compared to radical decarbonization.", keywords: ["geoengineering", "thermodynamics"] },
    { id: 's_c2_44', title: "Solo Pulse [C2]", promptEn: "Critique the ontological reductionism of human linguistic expression in algorithmic transformer architectures.", keywords: ["linguistic reductionism", "transformers"] },
    { id: 's_c2_45', title: "Solo Pulse [C2]", promptEn: "Deconstruct the geopolitical power shifts resulting from the fragmentation of global subsea data routing infrastructure.", keywords: ["subsea routing", "geopolitics"] },
    { id: 's_c2_46', title: "Solo Pulse [C2]", promptEn: "Analyze the legal status of synthetic biological organisms engineered for autonomous carbon sequestration.", keywords: ["synthetic biology", "environmental law"] },
    { id: 's_c2_47', title: "Solo Pulse [C2]", promptEn: "Evaluate the institutional resilience of WTO dispute settlement mechanisms amidst rising unilateral economic sanctions.", keywords: ["WTO", "sanctions"] },
    { id: 's_c2_48', title: "Solo Pulse [C2]", promptEn: "Critique the moral hazard created by state-backed sovereign bailouts of systemic non-bank shadow financial entities.", keywords: ["shadow banking", "moral hazard"] },
    { id: 's_c2_49', title: "Solo Pulse [C2]", promptEn: "Deconstruct the socio-ecological paradoxes of deepsea mineral extraction for green energy transition hardware.", keywords: ["deepsea mining", "green transition"] },
    { id: 's_c2_50', title: "Solo Pulse [C2]", promptEn: "Analyze the existential implications of artificial general intelligence on human self-determination frameworks.", keywords: ["AGI", "human agency"] }
  ]
};

// ⚡ LẤY NGAY 1 ĐỀ LOCAL KHÔNG TRÙNG (0.01s)
export function getInstantSoloTopic(cefrLevel: string = 'A1'): SoloTopic {
  const levelKey = (cefrLevel || 'A1').toUpperCase();
  const pool = LOCAL_SOLO_POOL[levelKey] || LOCAL_SOLO_POOL['A1'];
  
  const filtered = pool.filter(item => !sessionUsedTopicTexts.has(item.promptEn.toLowerCase()));
  const selected = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : pool[Math.floor(Math.random() * pool.length)];
  
  sessionUsedTopicTexts.add(selected.promptEn.toLowerCase());
  return { ...selected, id: `instant_solo_${Date.now()}_${Math.random()}` };
}

// ⚡ GỌI GROQ AI NGẦM ĐỂ CẬP NHẬT ĐỀ CHI TIẾT
export async function generateSoloTopic(cefrLevel: string = 'A1'): Promise<SoloTopic> {
  const uniqueSeed = `solo_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const levelKey = (cefrLevel || 'A1').toUpperCase();
  const isLowLevel = ['A1', 'A2', 'B1'].includes(levelKey);
  const excludedList = Array.from(sessionUsedTopicTexts).slice(-15).join(' | ');

  const systemPrompt = `You are a strict CEFR Test Designer. Generate ONE Solo Topic STRICTLY for Level ${levelKey}.
STRICT RULES:
${isLowLevel 
  ? `- Topic must be simple/intermediate. Include BOTH "promptEn" and "promptVi" (Vietnamese translation).` 
  : `- Topic MUST be highly academic, professional, or complex for Level ${levelKey}. 100% ADVANCED ENGLISH ONLY. STRICTLY DO NOT PROVIDE "promptVi".`
}
Return ONLY valid JSON matching:
{
  "title": "Solo Pulse [${levelKey}]",
  "promptEn": "Topic text",
  ${isLowLevel ? '"promptVi": "Bản dịch tiếng Việt",' : ''}
  "keywords": ["word1", "word2"]
}`;

  try {
    const apiCall = groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a BRAND NEW topic for CEFR [${levelKey}]. Request ID: ${uniqueSeed}. Exclude: [${excludedList || 'None'}]` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 1.0,
      response_format: { type: 'json_object' }
    });

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Groq Timeout')), 3500)
    );

    const response: any = await Promise.race([apiCall, timeout]);
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    const promptEn = parsed.promptEn || `Topic for ${levelKey}`;

    sessionUsedTopicTexts.add(promptEn.toLowerCase());

    return {
      id: uniqueSeed,
      title: parsed.title || `Solo Pulse [${levelKey}]`,
      promptEn: promptEn,
      promptVi: isLowLevel ? parsed.promptVi : undefined,
      keywords: parsed.keywords || ["speaking"]
    };
  } catch (error) {
    return getInstantSoloTopic(cefrLevel);
  }
}