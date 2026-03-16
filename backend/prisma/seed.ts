import 'dotenv/config';
import { PrismaClient, EvaluationIndicator, EvaluationStatus, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt: { hashSync: (s: string, salt: number) => string } = require('bcryptjs');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ──────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(startYear: number, endYear: number): Date {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start));
}

function randomPhone(): string {
  const prefix = pick(['090', '091', '093', '097', '098', '035', '036', '038']);
  const number = Math.floor(Math.random() * 10_000_000)
    .toString()
    .padStart(7, '0');
  return `${prefix}${number}`;
}

const INDICATORS: EvaluationIndicator[] = [
  EvaluationIndicator.ACHIEVED,
  EvaluationIndicator.NEEDS_ASSISTANCE,
  EvaluationIndicator.NOT_ACHIEVED,
];

// ─── Free-text notes per domain (for realistic seed data) ─

const SECTION_NOTES: Record<string, string[]> = {
  'Vận động thô': [
    'Đi vững, chạy tốt trong sân chơi. Tập nhảy bằng hai chân',
    'Leo cầu thang có vịn tay, cần giám sát khi xuống',
    'Bắt bóng lớn tốt, cần luyện tập ném bóng chính xác hơn',
    'Giữ thăng bằng trên một chân được 3 giây, tập đi trên đường thẳng',
  ],
  'Vận động tinh': [
    'Cầm bút tốt, đang tập tô màu trong khung',
    'Xếp hình 4-6 mảnh được, cần hỗ trợ với hình phức tạp hơn',
    'Sử dụng kéo an toàn, cắt được đường thẳng. Tập cắt theo đường cong',
    'Xâu hạt lớn thành thạo, đang tập xâu hạt nhỏ',
  ],
  'Kỹ năng Bắt chước': [
    'Bắt chước được các động tác đơn giản theo mẫu',
    'Bắt chước vỗ tay, giơ tay theo hướng dẫn. Chưa bắt chước chuỗi hành động',
    'Tập bắt chước âm thanh và cử chỉ của cô giáo',
    'Bắt chước hành động trong sinh hoạt hàng ngày tốt hơn tháng trước',
  ],
  'Luyện hơi/cơ quan cấu âm': [
    'Tập thổi bóng, thổi nến. Hơi còn yếu, cần tập thêm',
    'Luyện cử động lưỡi, môi theo hướng dẫn. Phát âm rõ hơn',
    'Tập thổi còi, thổi bong bóng xà phòng để tăng cường hơi',
    'Cử động môi, lưỡi linh hoạt hơn, cần tiếp tục luyện tập',
  ],
  'Nhận thức': [
    'Nhận biết 6 màu cơ bản, đang học thêm màu mới',
    'Phân loại đồ vật theo màu sắc và hình dạng. Ghép hình đơn giản tốt',
    'Đếm được đến 5, nhận biết số 1-3. Tập so sánh nhiều/ít',
    'Nhận biết được một số chữ cái trong tên mình',
  ],
  'Ngôn ngữ thể hiện': [
    'Sử dụng từ đơn để gọi tên đồ vật, đang tập nói câu 2 từ',
    'Bắt đầu dùng câu ngắn để diễn đạt nhu cầu cơ bản',
    'Phát âm rõ hơn, tập kể lại sự việc đơn giản bằng 2-3 câu',
    'Chủ động gọi tên người thân, cần khuyến khích nói câu dài hơn',
  ],
  'Ngôn ngữ tiếp nhận': [
    'Hiểu hướng dẫn 1 bước, đang tập hiểu hướng dẫn 2 bước',
    'Chỉ đúng đồ vật khi được gọi tên. Hiểu câu hỏi có/không',
    'Phản hồi tốt khi gọi tên, hiểu các chỉ dẫn trong lớp học',
    'Hiểu các khái niệm cơ bản: to/nhỏ, trên/dưới. Tập thêm trong/ngoài',
  ],
  'Kỹ năng tự phục vụ': [
    'Tự ăn bằng thìa, cần hỗ trợ dùng đũa. Tự uống nước từ ly',
    'Tự mặc áo phông, cần giúp với quần có khóa và cài nút',
    'Rửa tay đúng cách sau khi nhắc nhở. Tập đánh răng tự lập',
    'Tự đi vệ sinh ban ngày, ban đêm vẫn cần hỗ trợ',
  ],
  'Kỹ năng Giao tiếp - Xã hội': [
    'Bắt đầu chơi cùng bạn, nhưng chưa chia sẻ đồ chơi tốt',
    'Tham gia hoạt động nhóm khi có hướng dẫn, cần nhắc nhở chờ đến lượt',
    'Chào hỏi cô giáo và bạn khi được nhắc. Tập chào tự giác',
    'Thích nghi tốt hơn với thay đổi lịch trình trong ngày',
  ],
  'Tập trung chú ý – Giao tiếp mắt': [
    'Duy trì giao tiếp mắt 3-5 giây khi được gọi tên',
    'Tập trung vào hoạt động 5-7 phút, cần nhắc nhở khi mất tập trung',
    'Giao tiếp mắt tốt hơn so với tháng trước, tập nhìn theo chỉ tay',
    'Ngồi yên được 5 phút trong giờ học, đang tập tăng thời gian',
  ],
  'Các vấn đề về hành vi': [
    'Giảm hành vi tự kích thích khi tham gia hoạt động có cấu trúc',
    'Ít la hét khi chuyển đổi hoạt động, cần chuẩn bị trước cho bé',
    'Kiểm soát cảm xúc tốt hơn, ít khóc khi không được đáp ứng ngay',
    'Không có hành vi tiêu cực đáng lo ngại trong tháng này',
  ],
};

const GENERAL_EVAL_NOTES = [
  'Tiến bộ rõ rệt so với tháng trước',
  'Cần hỗ trợ thêm từ phụ huynh',
  'Thực hiện tốt khi có hướng dẫn',
  'Chưa ổn định, cần theo dõi thêm',
  'Tự tin hơn trong hoạt động nhóm',
  'Cần luyện tập thêm ở nhà',
  'Đạt kết quả tốt trong tuần cuối',
  'Có phản hồi tích cực với bạn bè',
];

// ─── Evaluation Domains Data ─────────────────────────────

const DOMAINS_DATA = [
  { name: 'Vận động thô', order: 1 },
  { name: 'Vận động tinh', order: 2 },
  { name: 'Kỹ năng Bắt chước', order: 3 },
  { name: 'Luyện hơi/cơ quan cấu âm', order: 4 },
  { name: 'Nhận thức', order: 5 },
  { name: 'Ngôn ngữ thể hiện', order: 6 },
  { name: 'Ngôn ngữ tiếp nhận', order: 7 },
  { name: 'Kỹ năng tự phục vụ', order: 8 },
  { name: 'Kỹ năng Giao tiếp - Xã hội', order: 9 },
  { name: 'Tập trung chú ý – Giao tiếp mắt', order: 10 },
  { name: 'Các vấn đề về hành vi', order: 11 },
];

// ─── Users Data ───────────────────────────────────────────

const USERS_DATA = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    firstName: 'Quản trị',
    lastName: 'Hệ thống',
    role: Role.ADMIN,
  },
  {
    email: 'teacher1@example.com',
    password: 'teacher123',
    firstName: 'Nguyễn Thị',
    lastName: 'Hoa',
    role: Role.TEACHER,
  },
  {
    email: 'teacher2@example.com',
    password: 'teacher123',
    firstName: 'Trần Văn',
    lastName: 'Minh',
    role: Role.TEACHER,
  },
  {
    email: 'teacher3@example.com',
    password: 'teacher123',
    firstName: 'Lê Thị',
    lastName: 'Lan',
    role: Role.TEACHER,
  },
];

// ─── Classes Data ─────────────────────────────────────────

const CLASSES_DATA: Record<number, string[]> = {
  0: ['Lớp Mặt Trời', 'Lớp Cầu Vồng'],
  1: ['Lớp Hoa Hướng Dương', 'Lớp Mầm Non A'],
  2: ['Lớp Mầm Non B', 'Lớp Ngôi Sao'],
};

// ─── Students Data ────────────────────────────────────────

const FIRST_NAMES = [
  'An', 'Bình', 'Chi', 'Dũng', 'Hà', 'Hải', 'Hùng', 'Khánh',
  'Linh', 'Long', 'Mai', 'Minh', 'Nam', 'Ngọc', 'Phương', 'Quân',
  'Tâm', 'Thảo', 'Trung', 'Tuấn', 'Vy', 'Xuân', 'Yến', 'Đức',
  'Hạnh', 'Hiếu', 'Hương', 'Khôi', 'Lâm', 'Nhật',
];

const LAST_NAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh',
  'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ',
];

const PARENT_FIRST_NAMES = [
  'Anh', 'Bảo', 'Cường', 'Dung', 'Giang', 'Hằng',
  'Hữu', 'Kim', 'Lan', 'Mạnh', 'Nga', 'Phúc',
  'Quỳnh', 'Sơn', 'Thanh', 'Thủy', 'Toàn', 'Trang',
];

function generateStudents(count: number) {
  const students = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let firstName: string;
    let lastName: string;
    let key: string;

    do {
      firstName = pick(FIRST_NAMES);
      lastName = pick(LAST_NAMES);
      key = `${lastName} ${firstName}`;
    } while (usedNames.has(key));

    usedNames.add(key);

    students.push({
      firstName,
      lastName,
      dateOfBirth: randomDate(2018, 2022),
      parentName: `${lastName} ${pick(PARENT_FIRST_NAMES)}`,
      parentPhone: randomPhone(),
    });
  }

  return students;
}

// ─── Main Seed Function ──────────────────────────────────

async function main() {
  console.log('=== GDDB Seed Script ===\n');

  // ── 1. Seed evaluation domains ────────────────────────
  console.log('1. Seeding evaluation domains...');

  const domainIds: string[] = [];
  const domainNameToId: Record<string, string> = {};

  for (const d of DOMAINS_DATA) {
    const domain = await prisma.evaluationDomain.upsert({
      where: { name: d.name },
      update: { order: d.order },
      create: { name: d.name, order: d.order },
    });
    domainIds.push(domain.id);
    domainNameToId[domain.name] = domain.id;
    console.log(`   + ${domain.name}`);
  }

  console.log(`   Total: ${domainIds.length} domains\n`);

  // ── 2. Seed users ───────────────────────────────────────
  console.log('2. Seeding users...');

  const users = [];

  for (const userData of USERS_DATA) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        password: bcrypt.hashSync(userData.password, 10),
      },
      create: {
        email: userData.email,
        password: bcrypt.hashSync(userData.password, 10),
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
      },
    });
    users.push(user);
    console.log(`   + ${user.email} (${user.role})`);
  }

  const teachers = users.filter((u) => u.role === Role.TEACHER);
  console.log();

  // ── 3. Seed classes ─────────────────────────────────────
  console.log('3. Seeding classes...');

  const allClasses: { id: string; teacherId: string; name: string }[] = [];

  for (let i = 0; i < teachers.length; i++) {
    const teacher = teachers[i];
    const classNames = CLASSES_DATA[i];

    for (const className of classNames) {
      const existing = await prisma.class.findFirst({
        where: { name: className, teacherId: teacher.id },
      });

      const classEntity = existing
        ? await prisma.class.update({
            where: { id: existing.id },
            data: { name: className },
          })
        : await prisma.class.create({
            data: { name: className, teacherId: teacher.id },
          });

      allClasses.push(classEntity);
      console.log(`   + ${className} (${teacher.firstName} ${teacher.lastName})`);
    }
  }

  console.log();

  // ── 4. Seed students ────────────────────────────────────
  console.log('4. Seeding students...');

  const allStudents: { id: string; classId: string }[] = [];

  for (const cls of allClasses) {
    const studentCount = 5 + Math.floor(Math.random() * 4); // 5-8
    const studentsData = generateStudents(studentCount);

    const existingCount = await prisma.student.count({
      where: { classId: cls.id },
    });

    if (existingCount >= 5) {
      const existing = await prisma.student.findMany({
        where: { classId: cls.id },
        select: { id: true, classId: true },
      });
      allStudents.push(...existing);
      console.log(`   ~ ${cls.name}: ${existing.length} students (already seeded)`);
      continue;
    }

    if (existingCount > 0) {
      await prisma.student.deleteMany({ where: { classId: cls.id } });
    }

    for (const s of studentsData) {
      const student = await prisma.student.create({
        data: {
          firstName: s.firstName,
          lastName: s.lastName,
          dateOfBirth: s.dateOfBirth,
          parentName: s.parentName,
          parentPhone: s.parentPhone,
          classId: cls.id,
        },
      });
      allStudents.push({ id: student.id, classId: student.classId });
    }

    console.log(`   + ${cls.name}: ${studentsData.length} students`);
  }

  console.log();

  // ── 5. Seed evaluations ─────────────────────────────────
  console.log('5. Seeding evaluations...');

  // Last 2 months relative to current date
  const now = new Date();
  const evalMonths: { year: number; month: number }[] = [];

  for (let offset = 1; offset <= 2; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    evalMonths.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  console.log(
    `   Months: ${evalMonths.map((m) => `${m.month}/${m.year}`).join(', ')}`,
  );

  let evalCount = 0;
  let sectionCount = 0;
  let finalizedCount = 0;

  for (const student of allStudents) {
    const cls = allClasses.find((c) => c.id === student.classId);
    if (!cls) continue;

    for (const period of evalMonths) {
      // Skip if evaluation already exists
      const existing = await prisma.evaluation.findUnique({
        where: {
          studentId_year_month: {
            studentId: student.id,
            year: period.year,
            month: period.month,
          },
        },
      });
      if (existing) continue;

      // Randomly finalize ~40% of evaluations
      const shouldFinalize = Math.random() < 0.4;

      const evaluation = await prisma.evaluation.create({
        data: {
          studentId: student.id,
          teacherId: cls.teacherId,
          year: period.year,
          month: period.month,
          notes: Math.random() < 0.3 ? pick(GENERAL_EVAL_NOTES) : null,
          status: shouldFinalize
            ? EvaluationStatus.FINALIZED
            : EvaluationStatus.DRAFT,
          ...(shouldFinalize
            ? { finalizedAt: new Date(), finalizedById: cls.teacherId }
            : {}),
        },
      });

      if (shouldFinalize) finalizedCount++;
      evalCount++;

      // Create sections for every domain
      for (const domainData of DOMAINS_DATA) {
        const domainId = domainNameToId[domainData.name];
        const hasIndicator = Math.random() < 0.85;
        const hasNote = Math.random() < 0.6;
        const domainNotes = SECTION_NOTES[domainData.name] || GENERAL_EVAL_NOTES;

        await prisma.evaluationSection.create({
          data: {
            evaluationId: evaluation.id,
            domainId,
            indicator: hasIndicator ? pick(INDICATORS) : null,
            note: hasNote ? pick(domainNotes) : null,
          },
        });
        sectionCount++;
      }
    }
  }

  console.log(`   + ${evalCount} evaluations (${finalizedCount} finalized)`);
  console.log(`   + ${sectionCount} evaluation sections\n`);

  // ── Summary ─────────────────────────────────────────────
  const counts = {
    domains: await prisma.evaluationDomain.count(),
    users: await prisma.user.count(),
    classes: await prisma.class.count(),
    students: await prisma.student.count(),
    evaluations: await prisma.evaluation.count(),
    sections: await prisma.evaluationSection.count(),
  };

  console.log('=== Seed Complete ===');
  console.log(`   Domains:     ${counts.domains}`);
  console.log(`   Users:       ${counts.users}`);
  console.log(`   Classes:     ${counts.classes}`);
  console.log(`   Students:    ${counts.students}`);
  console.log(`   Evaluations: ${counts.evaluations}`);
  console.log(`   Sections:    ${counts.sections}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
