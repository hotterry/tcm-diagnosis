// ===== State =====
let currentClassic = 'shanghan';
let currentVolume = 1;
let currentMeridian = null;
let currentExtraMeridian = null;

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  showPage('home');
});

// ===== Navigation =====
function bindEvents() {
  // Sidebar nav
  document.querySelectorAll('.nav-sub a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(link.dataset.page);
    });
  });

  // Home cards
  document.querySelectorAll('.card[data-nav]').forEach(card => {
    card.addEventListener('click', () => showPage(card.dataset.nav));
  });

  // Menu toggle (mobile)
  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Close sidebar on outside click (mobile)
  document.getElementById('main-content').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById('sidebar').classList.remove('open');
    }
  });

  // Diagnosis
  document.getElementById('analyze-btn').addEventListener('click', runDiagnosis);
  document.getElementById('reset-btn').addEventListener('click', resetDiagnosis);

  // Classic tabs
  document.querySelectorAll('.classic-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const parent = tab.parentElement;
      parent.querySelectorAll('.classic-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentVolume = parseInt(tab.dataset.volume);
      renderClassicContent();
    });
  });

  // Formula search
  const formulaSearch = document.getElementById('formula-search');
  if (formulaSearch) {
    formulaSearch.addEventListener('input', renderFormulas);
  }

  // Herb search
  const herbSearch = document.getElementById('herb-search');
  if (herbSearch) {
    herbSearch.addEventListener('input', renderHerbs);
  }

  // Pulse search
  const pulseSearch = document.getElementById('pulse-search');
  if (pulseSearch) {
    pulseSearch.addEventListener('input', renderPulses);
  }
  // Pulse category buttons
  document.querySelectorAll('.pulse-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pulse-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPulses();
    });
  });

  // Global search
  document.getElementById('search-input').addEventListener('input', handleGlobalSearch);
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-sub a').forEach(a => a.classList.remove('active'));

  const pageMap = {
    'home': '首页', 'diagnosis': '诊断助手', 'pulse': '脉象查询', 'six-jing': '六经辨证',
    'eight-principle': '八纲辩证', 'formulas': '方剂速查', 'herbs': '药物手册',
    'acupuncture': '针灸穴位', 'meridians': '经络循行',
    'shanghan': '伤寒论', 'jinkui': '金匮要略', 'neijing': '黄帝内经', 'shennong': '神农本草经'
  };

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  document.getElementById('page-title').textContent = pageMap[page] || page;

  // Highlight sidebar
  document.querySelectorAll('.nav-sub a').forEach(a => {
    if ((a.dataset.page === page) || (a.dataset.page === page && a.dataset.series === page)) {
      a.classList.add('active');
    }
  });

  // Init page content
  if (page === 'pulse') renderPulses();
  if (page === 'formulas') renderFormulas();
  if (page === 'herbs') renderHerbs();
  if (page === 'acupuncture') renderAcupuncture();
  if (page === 'meridians') renderMeridians();
  if (page === 'shanghan') { currentClassic = 'shanghan'; renderClassicContent(); }
  if (page === 'jinkui') { currentClassic = 'jinkui'; renderClassicContent(); }
  if (page === 'neijing') { currentClassic = 'neijing'; renderClassicContent(); }
  if (page === 'shennong') { currentClassic = 'shennong'; renderClassicContent(); }

  document.getElementById('sidebar').classList.remove('open');
}

// ===== Diagnosis Engine =====

// Diagnosis knowledge base: symptom groups mapped to syndromes and formulas
const diagnosisRules = {

  // Sun-Yang (Taiyang) patterns
  sunWind: {
    symptoms: ['恶风', '汗出', '脉浮', '发热'],
    syndrome: '太阳中风证',
    jing: '太阳病',
    explanation: '卫气不固，营卫不和。风邪袭表，汗出而卫气外泄。',
    formulas: [
      { name: '桂枝汤', usage: '调和营卫，解肌发表。用于太阳中风，发热汗出恶风脉浮缓。剂量：桂枝三两 芍药三两 甘草二两 生姜三两 大枣十二枚' }
    ]
  },
  sunCold: {
    symptoms: ['恶寒', '发热', '无汗', '头痛', '身痛', '脉浮'],
    syndrome: '太阳伤寒证',
    jing: '太阳病',
    explanation: '寒邪束表，卫阳被遏，营阴郁滞。腠理闭塞无汗。',
    formulas: [
      { name: '麻黄汤', usage: '发汗解表，宣肺平喘。用于太阳伤寒，恶寒发热无汗头痛身痛脉浮紧。剂量：麻黄三两 桂枝二两 杏仁七十个 甘草一两' }
    ]
  },
  sunDragon: {
    symptoms: ['恶寒', '发热', '无汗', '心烦'],
    syndrome: '太阳表实证兼内热（大青龙汤证）',
    jing: '太阳病',
    explanation: '外寒束表，内有郁热。烦躁为内热之征。',
    formulas: [
      { name: '大青龙汤', usage: '发汗解表，兼清里热。用于太阳伤寒脉浮紧，发热恶寒身痛，不汗出而烦躁者。剂量：麻黄六两 桂枝二两 甘草二两 杏仁四十枚 石膏如鸡子大 生姜三两 大枣十枚' }
    ]
  },
  sunWater: {
    symptoms: ['小便不利', '消渴', '发热'],
    syndrome: '太阳蓄水证',
    jing: '太阳病',
    explanation: '表邪循经入腑，膀胱气化不利，水蓄下焦。',
    formulas: [
      { name: '五苓散', usage: '利水渗湿，温阳化气。用于小便不利，烦渴欲饮，饮入即吐，发热脉浮。剂量：猪苓十八铢 泽泻一两六铢 白术十八铢 茯苓十八铢 桂枝半两' }
    ]
  },

  // Yangming patterns
  yangmingJing: {
    symptoms: ['大热', '大汗', '大渴', '脉洪大'],
    syndrome: '阳明经证（白虎汤证）',
    jing: '阳明病',
    explanation: '无形邪热弥漫全身，里热炽盛，迫津外泄。',
    formulas: [
      { name: '白虎汤', usage: '清热生津。用于阳明经证，大热大汗大渴脉洪大。剂量：知母六两 石膏一斤 甘草二两 粳米六合' }
    ]
  },
  yangmingFu: {
    symptoms: ['潮热', '便秘', '腹痛拒按', '谵语'],
    syndrome: '阳明腑证（承气汤证）',
    jing: '阳明病',
    explanation: '有形实热结于肠胃，燥屎内结。',
    formulas: [
      { name: '大承气汤', usage: '峻下热结。用于阳明腑实，潮热谵语，腹痛拒按，便秘。剂量：大黄四两 厚朴八两 枳实五枚 芒硝三合' }
    ]
  },
  yangmingMildHeat: {
    symptoms: ['便秘', '口苦', '发热'],
    syndrome: '阳明腑证轻证',
    jing: '阳明病',
    explanation: '热结未深，腹未大满痛。',
    formulas: [
      { name: '小承气汤', usage: '轻下热结。用于阳明腑实轻证，大便硬而不甚。剂量：大黄四两 厚朴二两 枳实三枚' }
    ]
  },

  // Shaoyang patterns
  shaoyang: {
    symptoms: ['口苦', '咽干', '目眩', '胸胁苦满', '心烦', '喜呕', '往来寒热'],
    syndrome: '少阳病（小柴胡汤证）',
    jing: '少阳病',
    explanation: '邪入少阳，枢机不利，正邪分争于半表半里。',
    formulas: [
      { name: '小柴胡汤', usage: '和解少阳。用于少阳病，口苦咽干目眩，往来寒热，胸胁苦满，默默不欲饮食，心烦喜呕。剂量：柴胡八两 黄芩三两 人参三两 半夏半升 甘草三两 生姜三两 大枣十二枚' }
    ]
  },

  // Taiyin patterns
  taiyin: {
    symptoms: ['腹满而吐', '食欲不振', '便溏'],
    syndrome: '太阴病（理中汤证）',
    jing: '太阴病',
    explanation: '脾阳虚弱，寒湿内停，升降失常。',
    formulas: [
      { name: '理中汤', usage: '温中散寒，补气健脾。用于太阴病，腹满而吐，食不下，自利益甚。剂量：人参 干姜 甘草 白术各三两' }
    ]
  },

  // Shaoyin patterns
  shaoyinCold: {
    symptoms: ['脉微细', '但欲寐', '畏寒肢冷', '下利清谷', '小便清长'],
    syndrome: '少阴寒化证（四逆汤证）',
    jing: '少阴病',
    explanation: '心肾阳虚，阴寒内盛，阳气衰微。',
    formulas: [
      { name: '四逆汤', usage: '回阳救逆。用于少阴寒化，四肢厥逆，下利清谷，脉微欲绝。剂量：生附子一枚 干姜一两半 甘草二两' }
    ]
  },
  shaoyinHeat: {
    symptoms: ['失眠', '心烦', '脉微细'],
    syndrome: '少阴热化证（黄连阿胶汤证）',
    jing: '少阴病',
    explanation: '肾阴不足，心火亢盛，水火不济。',
    formulas: [
      { name: '黄连阿胶汤', usage: '滋阴降火，交通心肾。用于少阴热化，心中烦，不得卧。剂量：黄连四两 黄芩二两 芍药二两 阿胶三两 鸡子黄二枚' }
    ]
  },

  // Jueyin pattern
  jueyin: {
    symptoms: ['消渴', '气上撞心', '恶心呕吐'],
    syndrome: '厥阴病（乌梅丸证）',
    jing: '厥阴病',
    explanation: '上热下寒，阴阳不相顺接，蛔虫扰动。',
    formulas: [
      { name: '乌梅丸', usage: '安蛔止痛，寒热并调。用于厥阴病，消渴，气上撞心，心中疼热，饥而不欲食，吐蛔。' }
    ]
  },

  // Pi-Wei (spleen-stomach) patterns
  piXu: {
    symptoms: ['腹胀', '食欲不振', '便溏', '恶心呕吐', '痞满', '呕吐清水'],
    syndrome: '脾胃虚寒证',
    jing: '太阴病',
    explanation: '脾胃阳气不足，运化失司，湿邪内停。',
    formulas: [
      { name: '理中汤', usage: '温中健脾。用于脾胃虚寒，腹胀纳差，呕吐下利。' },
      { name: '半夏泻心汤', usage: '和胃降逆，消痞散结。用于心下痞满，呕吐，肠鸣下利。剂量：半夏半升 黄芩 干姜 人参 甘草各三两 黄连一两 大枣十二枚' }
    ]
  },

  // Shuishi (water-dampness) patterns
  shuiShi: {
    symptoms: ['水肿', '小便不利', '腹胀'],
    syndrome: '水湿内停证',
    jing: '太阳病（兼证）',
    explanation: '阳气不足，气化失司，水湿不化。',
    formulas: [
      { name: '五苓散', usage: '化气利水。用于水肿，小便不利。' },
      { name: '真武汤', usage: '温阳利水。用于肾阳虚水泛，身瞤动，水肿，小便不利。剂量：茯苓 芍药 生姜各三两 白术二两 炮附子一枚' }
    ]
  },

  // Xin (heart) patterns
  xinXu: {
    symptoms: ['心悸', '失眠'],
    syndrome: '心阴不足证',
    jing: '少阴病',
    explanation: '心阴亏虚，心神失养。',
    formulas: [
      { name: '黄连阿胶汤', usage: '滋阴降火，养心安神。' },
      { name: '炙甘草汤', usage: '益气滋阴，通阳复脉。用于心动悸，脉结代。剂量：炙甘草四两 生姜三两 人参二两 生地黄一斤 桂枝三两 阿胶二两 麦冬半升 麻仁半升 大枣三十枚' }
    ]
  },

  // Fei (lung) patterns
  feiRe: {
    symptoms: ['咳嗽', '痰多', '发热'],
    syndrome: '肺热咳喘证',
    jing: '太阳病（兼证）',
    explanation: '邪热壅肺，肺失宣降。',
    formulas: [
      { name: '麻杏甘石汤', usage: '辛凉宣泄，清肺平喘。用于肺热咳喘，发热咳嗽气喘。剂量：麻黄四两 杏仁五十个 石膏半斤 甘草二两' }
    ]
  },

  // Pain-related patterns (疼痛辨证)

  // Chest pain (胸痛)
  chestYangBlock: {
    symptoms: ['胸痛', '心悸', '畏寒肢冷'],
    syndrome: '胸阳不振证',
    jing: '太阳病（兼证）',
    explanation: '胸阳不足，阴寒内盛，心脉痹阻。胸中阳气不得宣通。',
    formulas: [
      { name: '栝楼薤白白酒汤', usage: '通阳散结，豁痰下气。用于胸痹喘息咳唾，胸背痛，短气。剂量：栝楼实一枚 薤白半升 白酒七升' },
      { name: '栝楼薤白半夏汤', usage: '通阳散结，祛痰宽胸。用于胸痹不得卧，心痛彻背者。剂量：前方加半夏半升' }
    ]
  },
  chestBloodStasis: {
    symptoms: ['胸痛', '心悸', '失眠'],
    syndrome: '心血瘀阻证',
    jing: '少阴病（兼证）',
    explanation: '心脉瘀阻，血行不畅，不通则痛。痛如针刺，固定不移。',
    formulas: [
      { name: '血府逐瘀汤', usage: '活血化瘀，行气止痛。用于胸中血瘀，胸痛如针刺而有定处。' }
    ]
  },

  // Hypochondriac pain (胁痛)
  xiePainLiver: {
    symptoms: ['胁痛', '口苦', '心烦', '胸胁苦满'],
    syndrome: '肝气郁结证',
    jing: '少阳病',
    explanation: '肝失疏泄，气机郁滞，不通则痛。常因情志不遂诱发。',
    formulas: [
      { name: '小柴胡汤', usage: '和解少阳，疏利气机。用于胸胁苦满，往来寒热。' },
      { name: '柴胡疏肝散', usage: '疏肝理气，活血止痛。用于肝气郁结，胁肋胀痛。' }
    ]
  },

  // Epigastric pain (胃痛)
  stomachCold: {
    symptoms: ['胃痛', '畏寒肢冷', '恶心呕吐', '食欲不振'],
    syndrome: '胃寒证',
    jing: '太阴病',
    explanation: '寒邪犯胃，或脾胃阳虚，寒从中生。胃失和降，气机阻滞。',
    formulas: [
      { name: '理中汤', usage: '温中散寒，健脾和胃。用于脾胃虚寒，胃痛喜温喜按。' },
      { name: '吴茱萸汤', usage: '温中补虚，降逆止呕。用于胃寒呕吐，胃痛。剂量：吴茱萸一升 人参三两 生姜六两 大枣十二枚' }
    ]
  },
  stomachHeat: {
    symptoms: ['胃痛', '口苦', '便秘', '心烦'],
    syndrome: '胃热证',
    jing: '阳明病',
    explanation: '胃火炽盛，灼伤胃络。胃痛灼热，消谷善饥，口臭便秘。',
    formulas: [
      { name: '白虎汤', usage: '清热生津。用于阳明气分热盛。' },
      { name: '大黄黄连泻心汤', usage: '清热泻火。用于胃热痞满。' }
    ]
  },

  // Abdominal pain (腹痛)
  abdominalCold: {
    symptoms: ['脐周痛', '畏寒肢冷', '便溏'],
    syndrome: '寒凝腹痛证',
    jing: '太阴病',
    explanation: '寒邪直中，或脾阳不足，寒凝气滞，腹中冷痛。',
    formulas: [
      { name: '大建中汤', usage: '温中散寒，缓急止痛。用于心胸中大寒痛，呕不能饮食。' },
      { name: '附子粳米汤', usage: '温中散寒，降逆止痛。用于腹中寒气，雷鸣切痛。' }
    ]
  },
  abdominalStasis: {
    symptoms: ['少腹痛', '便秘', '腹胀'],
    syndrome: '下焦瘀热证（桃核承气汤证）',
    jing: '太阳病（蓄血证）',
    explanation: '瘀热互结下焦，少腹急结硬满，小便自利。',
    formulas: [
      { name: '桃核承气汤', usage: '破血逐瘀，清热通下。用于少腹急结，其人如狂。' }
    ]
  },

  // Lower back pain (腰痛)
  lowBackKidney: {
    symptoms: ['腰痛', '畏寒肢冷', '水肿', '小便清长'],
    syndrome: '肾阳虚腰痛证',
    jing: '少阴病',
    explanation: '肾阳不足，腰为肾之府，失于温养。酸痛绵绵，喜温喜按。',
    formulas: [
      { name: '八味肾气丸', usage: '温补肾阳。用于肾阳不足，腰痛脚软，小便不利或反多。' },
      { name: '真武汤', usage: '温阳利水。用于肾阳虚水泛，腰痛水肿。' }
    ]
  },

  // Joint pain (关节痛)
  jointWindDamp: {
    symptoms: ['关节痛', '身痛', '畏寒肢冷'],
    syndrome: '风寒湿痹证',
    jing: '太阳病（兼证）',
    explanation: '风寒湿三气杂至，合而为痹。关节疼痛，遇寒加重。',
    formulas: [
      { name: '桂枝附子汤', usage: '温经散寒，祛风除湿。用于风湿相搏，身体疼烦。' },
      { name: '甘草附子汤', usage: '温经散寒，祛湿止痛。用于风湿相搏，骨节疼烦，掣痛不得屈伸。' }
    ]
  },

  // Throat pain (咽痛)
  throatHeat: {
    symptoms: ['咽痛', '发热', '咳嗽'],
    syndrome: '少阴咽痛证（热证）',
    jing: '少阴病',
    explanation: '少阴经脉循喉咙，热邪循经上扰。',
    formulas: [
      { name: '桔梗汤', usage: '宣肺利咽。用于少阴咽痛。剂量：桔梗一两 甘草二两' },
      { name: '苦酒汤', usage: '清热利咽，敛疮消肿。用于咽中伤生疮，不能语言。' }
    ]
  },
  throatCold: {
    symptoms: ['咽痛', '畏寒肢冷', '脉微细'],
    syndrome: '少阴咽痛证（寒证）',
    jing: '少阴病',
    explanation: '少阴阳虚，寒邪客于咽喉。咽痛不红不肿。',
    formulas: [
      { name: '半夏散及汤', usage: '散寒通阳，利咽止痛。用于少阴病，咽中痛。' }
    ]
  },

  // General pain (generalized body pain)
  generalPainWind: {
    symptoms: ['身痛', '恶风', '发热', '汗出'],
    syndrome: '太阳中风表虚证',
    jing: '太阳病',
    explanation: '风邪袭表，营卫不和，经气不畅，故身疼痛。',
    formulas: [
      { name: '桂枝汤', usage: '解肌发表，调和营卫。用于太阳中风，头痛发热，汗出恶风。' }
    ]
  },

  // Gan-Yang (liver) patterns
  ganYang: {
    symptoms: ["眩晕", "目眩", "头痛"],
    syndrome: "肝阳上亢证",
    jing: "厥阴病（兼证）",
    explanation: "肝阴不足，阴不制阳，肝阳上扰清窍。",
    formulas: [
      { name: "天麻钩藤饮", usage: "平肝潜阳，清热安神。用于肝阳上亢，眩晕耳鸣，头痛目眩。" },
      { name: "镇肝熄风汤", usage: "镇肝熄风，滋阴潜阳。用于肝阳上扰，头晕目眩。" }
    ]
  },
};

function runDiagnosis() {
  const checked = Array.from(document.querySelectorAll('.symptom:checked')).map(el => el.value);
  const resultDiv = document.getElementById('diagnosis-result');
  const content = document.getElementById('result-content');

  if (checked.length === 0) {
    resultDiv.style.display = 'block';
    content.innerHTML = '<p style="color:var(--text-dim);">请至少选择一个症状。</p>';
    return;
  }

  // Score each rule against selected symptoms
  const scores = [];
  for (const [key, rule] of Object.entries(diagnosisRules)) {
    const matched = rule.symptoms.filter(s => checked.includes(s));
    if (matched.length > 0) {
      scores.push({
        key,
        ...rule,
        matched,
        matchCount: matched.length,
        ratio: matched.length / rule.symptoms.length
      });
    }
  }

  // Sort by match ratio (desc), then by absolute count
  scores.sort((a, b) => {
    if (b.ratio !== a.ratio) return b.ratio - a.ratio;
    return b.matchCount - a.matchCount;
  });

  // Show top results
  const topResults = scores.slice(0, 3);

  resultDiv.style.display = 'block';
  if (topResults.length === 0) {
    content.innerHTML = '<p style="color:var(--text-dim);">根据所选症状，暂无完全匹配的证型。建议增加更多症状信息，或参考六经辨证和方剂速查模块。</p>';
    return;
  }

  let html = '';
  topResults.forEach((r, i) => {
    html += `
      <div class="result-item">
        <h4>${i === 0 ? '🏆 ' : ''}${r.syndrome} — ${r.jing}</h4>
        <p>${r.explanation}</p>
        <p style="color:var(--text-dim);font-size:0.75rem;margin-top:4px;">匹配症状：${r.matched.join('、')}（${Math.round(r.ratio * 100)}% 匹配）</p>
        ${r.formulas.map(f => `<span class="formula-tag">${f.name}</span>`).join(' ')}
        <div style="margin-top:8px;">
          ${r.formulas.map(f => `<p style="font-size:0.78rem;color:var(--text-dim);">💊 <strong>${f.name}</strong>：${f.usage}</p>`).join('')}
        </div>
      </div>
    `;
  });

  content.innerHTML = html;
}

function resetDiagnosis() {
  document.querySelectorAll('.symptom:checked').forEach(el => el.checked = false);
  document.getElementById('diagnosis-result').style.display = 'none';
}

// ===== Pulse Diagnosis =====

const pulseData = [
  // 浮脉类
  { name: '浮脉', category: '浮', form: '轻取即得，重按稍减而不空，举之泛泛而有余', indication: '表证。浮而有力为表实，浮而无力为表虚。', detail: '脉位表浅，轻触即感。多见于外感表证，或虚阳外越。' },
  { name: '洪脉', category: '浮', form: '脉体阔大，来盛去衰，状如波涛汹涌', indication: '热盛。气分热盛，阳明经证。', detail: '脉大而有力，如洪水之来。主阳明气分热盛，亦见于虚劳、失血等虚证（洪而无力）。' },
  { name: '濡脉', category: '浮', form: '浮而细软，轻取即得，重按不显', indication: '虚证、湿证。气血不足，湿邪困阻。', detail: '如绵絮浮水，软而无力。主诸虚劳损，又主湿。' },
  { name: '散脉', category: '浮', form: '浮散无根，至数不齐，按之即无', indication: '元气离散，脏腑之气将绝。', detail: '脉来浮大无根，散乱不聚。为元气败散之危候。' },
  { name: '芤脉', category: '浮', form: '浮大中空，如按葱管，两边实中间空', indication: '失血、亡阴。大失血或津液大伤。', detail: '浮大而软，按之中央空、两边实。多见于大出血或吐泻伤津之后。' },
  { name: '革脉', category: '浮', form: '浮而搏指，外坚中空，如按鼓皮', indication: '亡血、失精、半产、崩漏。', detail: '脉来弦急而中空，如按鼓皮。主精血亏虚，寒邪内盛。' },

  // 沉脉类
  { name: '沉脉', category: '沉', form: '轻取不应，重按始得', indication: '里证。沉而有力为里实，沉而无力为里虚。', detail: '脉位深在，需重按方觉。主病在里，亦可见于肥胖或冬季常人。' },
  { name: '伏脉', category: '沉', form: '重按至筋骨始得，较沉脉更深', indication: '邪闭、厥证、剧痛。阳气内伏不得宣通。', detail: '脉伏不出，须极重按至骨乃得。主邪气闭塞，阳气郁伏，或剧痛厥逆。' },
  { name: '牢脉', category: '沉', form: '沉而实大弦长，坚牢不移', indication: '阴寒内盛，癥瘕积聚。', detail: '脉来沉实有力，大而弦长。主阴寒凝结之里实证，如癥瘕、痞块、疝气。' },
  { name: '弱脉', category: '沉', form: '沉而细软，重按乃得', indication: '气血不足，阳气虚衰。', detail: '脉沉细而无力。主久病气血亏虚，或阳虚不能鼓动脉气。' },

  // 迟脉类
  { name: '迟脉', category: '迟', form: '一息不足四至（<60次/分）', indication: '寒证。迟而有力为实寒，迟而无力为虚寒。', detail: '脉来迟缓，一息三至。主寒邪凝滞或阳虚内寒。运动员亦可见生理性迟脉。' },
  { name: '缓脉', category: '迟', form: '一息四至，来去和缓（60-70次/分）', indication: '常脉（正常）。亦主湿证、脾虚。', detail: '从容和缓，节律均匀。为正常脉象，说明胃气充足。若兼濡软无力则主湿邪困脾。' },
  { name: '涩脉', category: '迟', form: '往来艰涩，如轻刀刮竹', indication: '血瘀（涩而有力）、精伤血少（涩而无力）。', detail: '脉来细迟而不流利，有滞涩感。主瘀血内阻或精亏血少，脉道失养。' },
  { name: '结脉', category: '迟', form: '脉来迟缓，时有中止，止无定数', indication: '阴盛气结（结而有力）、气血虚衰（结而无力）。', detail: '脉律不齐，有间歇，但歇止无规律。主寒痰瘀血凝结或心气不足。' },

  // 数脉类
  { name: '数脉', category: '数', form: '一息五至以上（>90次/分）', indication: '热证。数而有力为实热，数而无力为虚热。', detail: '脉来急速，一息五至六至。主热邪内盛或阴虚火旺。小儿脉数属正常。' },
  { name: '促脉', category: '数', form: '脉来急数，时有中止，止无定数', indication: '阳热亢盛（促而有力）、脏器虚衰（促而无力）。', detail: '脉数而有不规则间歇。主阳热极盛，阴不济阳；亦见于心气衰微。' },
  { name: '疾脉', category: '数', form: '一息七至以上（>120次/分）', indication: '阳极阴竭、元气将脱。', detail: '脉来急疾，一息七八至。主阳热极盛，阴液枯竭，或虚阳外越之危候。' },
  { name: '动脉', category: '数', form: '脉形如豆，厥厥动摇，滑数有力', indication: '痛证、惊恐。', detail: '脉来滑数有力，应指如豆粒跳动。主剧痛或突发惊恐，阴阳相搏。' },

  // 虚脉类
  { name: '虚脉', category: '虚', form: '三部脉举按皆无力，指下空虚', indication: '虚证。气血两虚，脏腑亏损。', detail: '举之不足，按之空虚。为气血阴阳俱虚之象，多见于久病、重病恢复期。' },
  { name: '微脉', category: '虚', form: '极细极软，按之欲绝，若有若无', indication: '阳气衰微，气血大虚。', detail: '脉来微弱无力，几不可察。主阳衰气脱，心肾阳微之危重证。' },
  { name: '细脉', category: '虚', form: '脉细如线，但指感明显', indication: '气血两虚、诸虚劳损。亦主湿证。', detail: '脉管细小，应指如丝。主阴血不足，不能充盈脉道；或湿邪阻压脉道。' },
  { name: '代脉', category: '虚', form: '脉来中止，止有定数，良久复来', indication: '脏器衰微（代而无力）、跌仆损伤（代而有力）。', detail: '脉有规律性间歇，歇止时间较长。主心气衰微，元气不续，为脏气衰败之象。' },
  { name: '短脉', category: '虚', form: '首尾俱短，不及本位，寸尺均短', indication: '气虚（短而无力）、气滞（短而有力）。', detail: '脉来短缩，不能满于寸口。主气虚不运或气机郁滞。' },

  // 实脉类
  { name: '实脉', category: '实', form: '三部脉举按皆有力，来去俱盛', indication: '实证。邪气实而正气不虚。', detail: '脉来坚实有力，浮中沉三候皆然。主邪气盛实，正邪交争剧烈之里实证。' },
  { name: '滑脉', category: '实', form: '往来流利，如珠走盘，应指圆滑', indication: '痰饮、食滞、实热。亦为正常妊娠脉。', detail: '脉来流畅圆滑，有滚珠感。主痰湿内停、食积不化；孕妇亦可见滑脉。' },
  { name: '紧脉', category: '实', form: '脉来绷急，如牵绳转索，左右弹指', indication: '寒证、痛证、宿食。', detail: '脉管紧张，应指有力如绞索。主寒邪收引、剧痛拘急，或食积内停。' },
  { name: '弦脉', category: '实', form: '端直以长，如按琴弦，挺然指下', indication: '肝胆病、痛证、痰饮。亦见于春季常脉。', detail: '脉来直长有力，有弹弦感。主肝气郁结、肝阳上亢、诸痛、痰饮。' },
  { name: '长脉', category: '实', form: '首尾端直，超过本位，寸尺皆长', indication: '阳证、热证（长而有力）。亦为正常脉（长而和缓）。', detail: '脉来悠长，溢出寸尺之外。长而和缓为气血充盈之佳象；长而洪大为阳热亢盛。' },
];

let currentPulseCategory = 'all';

function renderPulses() {
  const container = document.getElementById('pulse-list');
  if (!container) return;

  const searchQ = (document.getElementById('pulse-search')?.value || '').toLowerCase().trim();
  const activeCat = document.querySelector('.pulse-cat-btn.active')?.dataset?.cat || 'all';

  let filtered = pulseData;
  if (activeCat !== 'all') {
    filtered = filtered.filter(p => p.category === activeCat);
  }
  if (searchQ) {
    filtered = filtered.filter(p => 
      p.name.includes(searchQ) || 
      p.indication.includes(searchQ) || 
      p.form.includes(searchQ) ||
      p.detail.includes(searchQ)
    );
  }

  container.innerHTML = filtered.map(p => `
    <div class="pulse-card">
      <div class="pulse-header">
        <h4>${p.name}</h4>
        <span class="pulse-cat-tag tag-${p.category}">${p.category}脉类</span>
      </div>
      <div class="pulse-form"><strong>脉形：</strong>${p.form}</div>
      <div class="pulse-indication"><strong>主病：</strong>${p.indication}</div>
      <div class="pulse-detail">${p.detail}</div>
    </div>
  `).join('');

  if (filtered.length === 0) {
    container.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:20px;">未找到匹配的脉象</p>';
  }
}


// ===== Formulas =====

const formulasData = [
  // Taiyang
  { name: '桂枝汤', jing: '太阳', category: '解表剂·辛温解表', composition: '桂枝三两 芍药三两 甘草二两 生姜三两 大枣十二枚', usage: '解肌发表，调和营卫。用于太阳中风证。', contraindications: '表实无汗者忌用。' },
  { name: '麻黄汤', jing: '太阳', category: '解表剂·辛温解表', composition: '麻黄三两 桂枝二两 杏仁七十个 甘草一两', usage: '发汗解表，宣肺平喘。用于太阳伤寒证。', contraindications: '表虚自汗、亡血家、疮家忌用。' },
  { name: '大青龙汤', jing: '太阳', category: '解表剂', composition: '麻黄六两 桂枝二两 甘草二两 杏仁四十枚 石膏如鸡子大 生姜三两 大枣十枚', usage: '发汗解表，兼清里热。用于外寒内热烦躁。', contraindications: '脉微弱、汗出恶风者忌用。' },
  { name: '小青龙汤', jing: '太阳', category: '解表剂', composition: '麻黄三两 桂枝三两 芍药三两 干姜三两 细辛三两 五味子半升 半夏半升 甘草三两', usage: '解表散寒，温肺化饮。用于外寒内饮。', contraindications: '阴虚干咳无痰者忌用。' },
  { name: '五苓散', jing: '太阳', category: '利水渗湿剂', composition: '猪苓十八铢 泽泻一两六铢 白术十八铢 茯苓十八铢 桂枝半两', usage: '利水渗湿，温阳化气。用于膀胱蓄水证。', contraindications: '津液损伤者忌用。' },
  { name: '桃核承气汤', jing: '太阳', category: '理血剂', composition: '桃仁五十个 大黄四两 桂枝二两 甘草二两 芒硝二两', usage: '破血逐瘀。用于太阳蓄血，少腹急结，如狂。', contraindications: '无瘀血者忌用。' },

  // Yangming
  { name: '白虎汤', jing: '阳明', category: '清热剂', composition: '知母六两 石膏一斤 甘草二两 粳米六合', usage: '清热生津。用于阳明经证大热大汗大渴脉洪大。', contraindications: '表证未解、血虚发热忌用。' },
  { name: '大承气汤', jing: '阳明', category: '泻下剂', composition: '大黄四两 厚朴八两 枳实五枚 芒硝三合', usage: '峻下热结。用于阳明腑实便秘腹痛谵语。', contraindications: '体虚、孕妇忌用。' },
  { name: '小承气汤', jing: '阳明', category: '泻下剂', composition: '大黄四两 厚朴二两 枳实三枚', usage: '轻下热结。用于阳明腑实轻证。', contraindications: '同大承气汤。' },
  { name: '调胃承气汤', jing: '阳明', category: '泻下剂', composition: '大黄四两 甘草二两 芒硝半升', usage: '缓下热结。用于阳明燥热初结。', contraindications: '同大承气汤。' },
  { name: '茵陈蒿汤', jing: '阳明', category: '利湿退黄剂', composition: '茵陈蒿六两 栀子十四枚 大黄二两', usage: '清热利湿退黄。用于阳明湿热发黄。', contraindications: '非湿热发黄者忌用。' },

  // Shaoyang
  { name: '小柴胡汤', jing: '少阳', category: '和解剂', composition: '柴胡八两 黄芩三两 人参三两 半夏半升 甘草三两 生姜三两 大枣十二枚', usage: '和解少阳。用于少阳病口苦咽干目眩胸胁苦满。', contraindications: '非少阳证者慎用。' },
  { name: '大柴胡汤', jing: '少阳', category: '和解剂', composition: '柴胡八两 黄芩三两 芍药三两 半夏半升 生姜五两 枳实四枚 大黄二两 大枣十二枚', usage: '和解少阳，内泄热结。用于少阳阳明合病。', contraindications: '无阳明里实者忌用。' },
  { name: '柴胡桂枝汤', jing: '少阳', category: '和解剂', composition: '柴胡四两 黄芩一两半 人参一两半 半夏二合半 甘草一两 桂枝一两半 芍药一两半 生姜一两半 大枣六枚', usage: '和解少阳，解表散邪。用于太阳少阳合病。', contraindications: '' },

  // Taiyin
  { name: '理中汤', jing: '太阴', category: '温里剂', composition: '人参 干姜 甘草 白术各三两', usage: '温中散寒，补气健脾。用于太阴病腹满吐利。', contraindications: '实热证者忌用。' },
  { name: '半夏泻心汤', jing: '太阴', category: '消痞剂', composition: '半夏半升 黄芩 干姜 人参 甘草各三两 黄连一两 大枣十二枚', usage: '和胃降逆，消痞散结。用于心下痞满不痛。', contraindications: '' },

  // Shaoyin
  { name: '四逆汤', jing: '少阴', category: '温里剂', composition: '生附子一枚 干姜一两半 甘草二两', usage: '回阳救逆。用于少阴寒化四肢厥逆脉微。', contraindications: '真热假寒者忌用。' },
  { name: '真武汤', jing: '少阴', category: '温里剂', composition: '茯苓 芍药 生姜各三两 白术二两 炮附子一枚', usage: '温阳利水。用于肾阳虚水泛水肿。', contraindications: '阴虚火旺者忌用。' },
  { name: '黄连阿胶汤', jing: '少阴', category: '安神剂', composition: '黄连四两 黄芩二两 芍药二两 阿胶三两 鸡子黄二枚', usage: '滋阴降火，交通心肾。用于少阴热化心烦不眠。', contraindications: '阳虚寒证者忌用。' },
  { name: '桔梗汤', jing: '少阴', category: '清热剂', composition: '桔梗一两 甘草二两', usage: '宣肺祛痰，利咽解毒。用于少阴咽痛。', contraindications: '' },

  // Jueyin
  { name: '乌梅丸', jing: '厥阴', category: '驱虫剂', composition: '乌梅三百枚 细辛六两 干姜十两 黄连十六两 当归四两 炮附子六两 蜀椒四两 桂枝六两 人参六两 黄柏六两', usage: '安蛔止痛，寒热并调。用于厥阴病吐蛔。', contraindications: '' },

  // Others
  { name: '炙甘草汤', jing: '太阳', category: '补益剂', composition: '炙甘草四两 生姜三两 人参二两 生地黄一斤 桂枝三两 阿胶二两 麦冬半升 麻仁半升 大枣三十枚', usage: '益气滋阴，通阳复脉。用于心动悸脉结代。', contraindications: '湿盛中满者忌用。' },
  { name: '麻杏甘石汤', jing: '太阳', category: '解表剂', composition: '麻黄四两 杏仁五十个 石膏半斤 甘草二两', usage: '辛凉宣泄，清肺平喘。用于肺热咳喘。', contraindications: '风寒咳嗽者忌用。' },
  { name: '芍药甘草汤', jing: '太阳', category: '补益剂', composition: '芍药四两 甘草四两', usage: '缓急止痛。用于脚挛急、腹痛。', contraindications: '' },
  { name: '桂枝加附子汤', jing: '太阳', category: '补阳剂', composition: '桂枝汤加炮附子一枚', usage: '解表温阳。用于太阳病发汗太过，漏汗不止，恶风，小便难，四肢微急。', contraindications: '' },
];

function renderFormulas() {
  const query = (document.getElementById('formula-search')?.value || '').toLowerCase();
  const list = document.getElementById('formula-list');
  if (!list) return;

  let filtered = formulasData;
  if (query) {
    filtered = formulasData.filter(f =>
      f.name.includes(query) || f.jing.includes(query) || f.category.includes(query) || f.usage.includes(query)
    );
  }

  list.innerHTML = filtered.map(f => `
    <div class="formula-item">
      <h4 onclick="this.parentElement.classList.toggle('open')">${f.name}</h4>
      <div class="formula-meta">
        <span>${f.jing}经</span>
        <span>${f.category}</span>
      </div>
      <div class="formula-detail">
        <p><strong>组成：</strong>${f.composition}</p>
        <p><strong>用法：</strong>${f.usage}</p>
        ${f.contraindications ? `<p><strong>禁忌：</strong>${f.contraindications}</p>` : ''}
      </div>
    </div>
  `).join('');
}

// ===== Herbs =====

const herbsData = [
  { name: '桂枝', pinyin: 'Guì Zhī', nature: '辛、甘，温', meridian: '心、肺、膀胱', category: '解表药·发散风寒', usage: '发汗解表，温经通阳。用于风寒表证、寒凝血滞、痰饮、蓄水证等。', neihanNote: '倪海厦强调桂枝温通心阳的作用，桂枝汤是群方之冠。' },
  { name: '麻黄', pinyin: 'Má Huáng', nature: '辛、微苦，温', meridian: '肺、膀胱', category: '解表药·发散风寒', usage: '发汗解表，宣肺平喘，利水消肿。用于伤寒表实证。', neihanNote: '麻黄发汗力强，有"麻黄发汗第一"之说。先煮去上沫。' },
  { name: '石膏', pinyin: 'Shí Gāo', nature: '辛、甘，大寒', meridian: '肺、胃', category: '清热药·清热泻火', usage: '清热泻火，除烦止渴。用于阳明经证大热大汗。', neihanNote: '倪师强调石膏要重用才有效，"石膏一斤始为白虎"。' },
  { name: '知母', pinyin: 'Zhī Mǔ', nature: '苦、甘，寒', meridian: '肺、胃、肾', category: '清热药·清热泻火', usage: '清热泻火，滋阴润燥。用于气分实热、阴虚发热。', neihanNote: '' },
  { name: '柴胡', pinyin: 'Chái Hú', nature: '苦、辛，微寒', meridian: '肝、胆', category: '解表药·发散风热', usage: '和解少阳，疏肝解郁，升举阳气。用于少阳病。', neihanNote: '小柴胡汤主药，和解半表半里之邪。剂量宜大，八两起。' },
  { name: '黄芩', pinyin: 'Huáng Qín', nature: '苦，寒', meridian: '肺、胆、胃、大肠', category: '清热药·清热燥湿', usage: '清热燥湿，泻火解毒，止血安胎。常配柴胡清少阳之热。', neihanNote: '倪师常用于清上焦及少阳郁热。' },
  { name: '大黄', pinyin: 'Dà Huáng', nature: '苦，寒', meridian: '脾、胃、大肠、肝、心包', category: '泻下药', usage: '泻热通便，凉血解毒，逐瘀通经。用于阳明腑实证。', neihanNote: '承气汤之主药，下燥屎必用。酒大黄活血力强。' },
  { name: '芒硝', pinyin: 'Máng Xiāo', nature: '咸、苦，寒', meridian: '胃、大肠', category: '泻下药', usage: '泻热通便，润燥软坚。常配大黄增强泻下之力。', neihanNote: '大承气汤中芒硝软坚散结，治燥屎。' },
  { name: '厚朴', pinyin: 'Hòu Pǔ', nature: '苦、辛，温', meridian: '脾、胃、肺、大肠', category: '理气药', usage: '行气消积，燥湿除满，降逆平喘。', neihanNote: '' },
  { name: '枳实', pinyin: 'Zhǐ Shí', nature: '苦、辛，微寒', meridian: '脾、胃、大肠', category: '理气药', usage: '破气消积，化痰散痞。常配厚朴行气导滞。', neihanNote: '' },
  { name: '干姜', pinyin: 'Gān Jiāng', nature: '辛，热', meridian: '脾、胃、心、肺', category: '温里药', usage: '温中散寒，回阳通脉，温肺化饮。', neihanNote: '倪师认为干姜守而不走，治里寒；生姜走而不守，散表寒。' },
  { name: '附子', pinyin: 'Fù Zǐ', nature: '辛、甘，大热，有毒', meridian: '心、肾、脾', category: '温里药', usage: '回阳救逆，补火助阳，散寒止痛。四逆汤主药。', neihanNote: '生附子回阳救逆，炮附子温补肾阳。久煎去毒。' },
  { name: '人参', pinyin: 'Rén Shēn', nature: '甘、微苦，平', meridian: '脾、肺、心', category: '补气药', usage: '大补元气，补脾益肺，生津安神。', neihanNote: '伤寒方中用于扶正，小柴胡汤和理中汤都用人参。' },
  { name: '甘草', pinyin: 'Gān Cǎo', nature: '甘，平', meridian: '心、肺、脾、胃', category: '补气药', usage: '补脾益气，清热解毒，祛痰止咳，缓急止痛，调和诸药。', neihanNote: '伤寒方中出现频率最高的药物之一，炙甘草偏补，生甘草偏清。' },
  { name: '芍药', pinyin: 'Sháo Yào', nature: '苦、酸，微寒', meridian: '肝、脾', category: '补血药', usage: '养血敛阴，柔肝止痛，平抑肝阳。', neihanNote: '白芍养血柔肝，赤芍活血化瘀。桂枝汤用白芍敛阴和营。' },
  { name: '半夏', pinyin: 'Bàn Xià', nature: '辛，温，有毒', meridian: '脾、胃、肺', category: '化痰药', usage: '燥湿化痰，降逆止呕，消痞散结。', neihanNote: '半夏泻心汤主药，治心下痞。' },
  { name: '黄连', pinyin: 'Huáng Lián', nature: '苦，寒', meridian: '心、肝、胃、大肠', category: '清热药·清热燥湿', usage: '清热燥湿，泻火解毒。用于心火亢盛、心烦不眠。', neihanNote: '黄连阿胶汤中用黄连泻心火，配合阿胶滋阴。' },
  { name: '阿胶', pinyin: 'Ē Jiāo', nature: '甘，平', meridian: '肺、肝、肾', category: '补血药', usage: '补血滋阴，润燥止血。', neihanNote: '黄连阿胶汤中用阿胶滋肾水，交通心肾。烊化冲服。' },
  { name: '杏仁', pinyin: 'Xìng Rén', nature: '苦，微温，有小毒', meridian: '肺、大肠', category: '止咳平喘药', usage: '降气止咳平喘，润肠通便。麻黄汤中配麻黄宣降肺气。', neihanNote: '' },
  { name: '大枣', pinyin: 'Dà Zǎo', nature: '甘，温', meridian: '脾、胃', category: '补气药', usage: '补中益气，养血安神，缓和药性。常配生姜调营卫。', neihanNote: '伤寒方中常与生姜配对，调和营卫，保护胃气。' },
];

function renderHerbs() {
  const query = (document.getElementById('herb-search')?.value || '').toLowerCase();
  const list = document.getElementById('herb-list');
  if (!list) return;

  let filtered = herbsData;
  if (query) {
    filtered = herbsData.filter(h =>
      h.name.includes(query) || h.nature.includes(query) || h.meridian.includes(query) || h.category.includes(query) || h.usage.includes(query)
    );
  }

  list.innerHTML = filtered.map(h => `
    <div class="herb-item" onclick="this.classList.toggle('open')">
      <div style="flex:1;">
        <h4>${h.name} <span style="color:var(--text-dim);font-size:0.7rem;">${h.pinyin}</span></h4>
        <div class="herb-tags">${h.nature} | ${h.category}</div>
        <div class="herb-detail">
          <p><strong>归经：</strong>${h.meridian}</p>
          <p><strong>功效：</strong>${h.usage}</p>
          ${h.neihanNote ? `<p style="color:var(--accent);"><strong>倪师注：</strong>${h.neihanNote}</p>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

// ===== Acupuncture =====

const meridiansData = [
  { id: 'lu', name: '手太阴肺经', points: 11, time: '寅时 3-5', fiveElement: '金', flow: '起中焦，下络大肠，复循胃口，上膈属肺，从肺系横出腋下，下循臑内，至肘中，循臂内，入寸口，循鱼际，出大指之端。' },
  { id: 'li', name: '手阳明大肠经', points: 20, time: '卯时 5-7', fiveElement: '金', flow: '起大指次指之端，循指上廉，出合谷两骨间，上入两筋之中，循臂上廉，入肘外廉，上臑外前廉，上肩，入缺盆，络肺，下膈属大肠。' },
  { id: 'st', name: '足阳明胃经', points: 45, time: '辰时 7-9', fiveElement: '土', flow: '起鼻之交頞中，入上齿中，环唇，沿喉咙入缺盆，下膈属胃络脾，直行脉下乳内廉，挟脐，入气街，支脉下膝膑，循胫外廉，下足跗，入中趾。' },
  { id: 'sp', name: '足太阴脾经', points: 21, time: '巳时 9-11', fiveElement: '土', flow: '起大趾之端，循趾内侧白肉际，过核骨后，上内踝前廉，循胫骨后，交出厥阴之前，上膝股内前廉，入腹属脾络胃。' },
  { id: 'ht', name: '手少阴心经', points: 9, time: '午时 11-13', fiveElement: '火', flow: '起心中，出属心系，下膈络小肠，支脉从心系上挟咽，系目系，直行脉从心系上肺，下出腋下，下循臑内后廉，至掌后锐骨之端，入掌内，循小指之内出其端。' },
  { id: 'si', name: '手太阳小肠经', points: 19, time: '未时 13-15', fiveElement: '火', flow: '起小指之端，循手外侧上腕，循臂骨下廉，出肘内侧两筋之间，上循臑外后廉，出肩解，绕肩胛，交肩上，入缺盆络心，循咽下膈，抵胃属小肠。' },
  { id: 'bl', name: '足太阳膀胱经', points: 67, time: '申时 15-17', fiveElement: '水', flow: '起目内眦，上额交巅，入络脑，还出别下项，循肩髆内，挟脊抵腰中，入循膂络肾属膀胱。支脉从腰中下挟脊贯臀入腘中。' },
  { id: 'ki', name: '足少阴肾经', points: 27, time: '酉时 17-19', fiveElement: '水', flow: '起小趾之下，斜走足心，出然谷之下，循内踝后，别入跟中，以上腨内，出腘内廉，上股内后廉，贯脊属肾络膀胱。' },
  { id: 'pc', name: '手厥阴心包经', points: 9, time: '戌时 19-21', fiveElement: '火', flow: '起胸中，出属心包络，下膈历络三焦。支脉从胸中出胁下，上抵腋下，下循臑内，入肘中，下臂行两筋之间，入掌中，循中指出其端。' },
  { id: 'sj', name: '手少阳三焦经', points: 23, time: '亥时 21-23', fiveElement: '火', flow: '起小指次指之端，上出两指之间，循手表腕出臂外两骨之间，上贯肘，循臑外上肩，入缺盆，布膻中，散络心包，下膈属三焦。' },
  { id: 'gb', name: '足少阳胆经', points: 44, time: '子时 23-1', fiveElement: '木', flow: '起目锐眦，上抵头角，下耳后，循颈至肩上，入缺盆。支脉从耳后入耳中出走耳前至目锐眦后，下颈合缺盆，下胸中贯膈，络肝属胆。' },
  { id: 'lv', name: '足厥阴肝经', points: 14, time: '丑时 1-3', fiveElement: '木', flow: '起大趾丛毛之际，上循足跗上廉，去内踝一寸，上循胫内廉，入毛中，环阴器，抵小腹，挟胃属肝络胆，上贯膈，布胁肋，循喉咙之后，上入颃颡，连目系。' },
];

const extraMeridiansData = [
  { id: 'cv', name: '任脉', points: 24, description: '起于胞中，下出会阴，经阴阜，沿腹部和胸部正中线上行，至咽喉，上行至下颌部，环绕口唇，沿面颊，分行至目眶下。总任一身之阴经。' },
  { id: 'dv', name: '督脉', points: 28, description: '起于胞中，下出会阴，后行于腰背正中，经骶、腰、背、项，沿头部正中线，至上唇系带处。总督一身之阳经。' },
  { id: 'chong', name: '冲脉', points: 0, description: '起于胞中，分为三支：一支沿腹腔后壁上行于脊柱内；一支沿腹腔前壁挟脐上行，散布于胸中。为十二经脉之海。' },
  { id: 'dai', name: '带脉', points: 0, description: '起于季胁，斜向下行到带脉穴，绕身一周。约束纵行诸经。' },
  { id: 'yin_qiao', name: '阴跷脉', points: 0, description: '起于足舟骨后方，上行内踝上，直上沿大腿内侧入前阴，上沿胸部入缺盆，出颈动脉入颧，入目内眦。主一身左右之阴。' },
  { id: 'yang_qiao', name: '阳跷脉', points: 0, description: '起于足跟外侧，沿外踝后上行，经下肢外侧、腹部、胸部、肩部，入项，上入目内眦。主一身左右之阳。' },
  { id: 'yin_wei', name: '阴维脉', points: 0, description: '起于小腿内侧，沿大腿内侧上行至腹部，与足太阴经相合，循胸入乳，与任脉交于颈部。维系联络全身阴经。' },
  { id: 'yang_wei', name: '阳维脉', points: 0, description: '起于足跟外侧，沿外踝后上行，经下肢外侧、胁肋、肩部、项后，与督脉交于风府、哑门。维系联络全身阳经。' },
];

// Key acupoints per meridian
const acupointsData = {
  lu: [
    { name: '中府', pinyin: 'Zhōngfǔ', number: 1, type: '肺之募穴', location: '胸前壁外上方，第一肋间隙，距前正中线6寸（约20厘米）', indications: '咳嗽气喘胸痛', note: '手太阴肺经之始。不宜深刺。' },
    { name: '尺泽', pinyin: 'Chǐzé', number: 5, type: '合穴', location: '肘横纹中，肱二头肌腱桡侧凹陷处', indications: '咳嗽咯血潮热咽喉肿痛', note: '合穴属水，肺经子穴。' },
    { name: '列缺', pinyin: 'Lièquē', number: 7, type: '络穴·八脉交会穴', location: '桡骨茎突上方，腕横纹上1.5寸（约5厘米）', indications: '头痛项强咳嗽咽痛面瘫', note: '头项寻列缺。通任脉。' },
    { name: '太渊', pinyin: 'Tàiyuān', number: 9, type: '输穴·原穴·八会穴', location: '腕横纹桡侧，桡动脉搏动处', indications: '咳嗽气喘无脉症腕臂痛', note: '脉会太渊。肺经母穴。' },
    { name: '鱼际', pinyin: 'Yújì', number: 10, type: '荥穴', location: '第一掌骨中点桡侧，赤白肉际处', indications: '咳嗽咯血咽喉肿痛发热', note: '荥穴属火。' },
    { name: '少商', pinyin: 'Shàoshāng', number: 11, type: '井穴', location: '拇指桡侧指甲角旁约0.1寸（约0.3厘米）', indications: '咽喉肿痛鼻衄发热昏迷', note: '井穴属木。可点刺出血。' },
  ],
  li: [
    { name: '商阳', pinyin: 'Shāngyáng', number: 1, type: '井穴', location: '食指桡侧指甲角旁约0.1寸（约0.3厘米）', indications: '咽喉肿痛齿痛耳鸣热病昏迷', note: '井穴属金。' },
    { name: '合谷', pinyin: 'Hégǔ', number: 4, type: '原穴', location: '手背第1、2掌骨间，第二掌骨桡侧中点', indications: '头痛齿痛面瘫发热腹痛', note: '面口合谷收。四总穴之一。孕妇禁针。' },
    { name: '手三里', pinyin: 'Shǒusānlǐ', number: 10, type: '', location: '阳溪与曲池连线上，肘横纹下2寸（约6.7厘米）', indications: '腹痛腹泻齿痛上肢不遂', note: '' },
    { name: '曲池', pinyin: 'Qūchí', number: 11, type: '合穴', location: '屈肘时肘横纹外侧端', indications: '热病头痛咽喉痛腹痛', note: '合穴属土。常用清热要穴。' },
    { name: '迎香', pinyin: 'Yíngxiāng', number: 20, type: '', location: '鼻翼外缘中点旁，鼻唇沟中', indications: '鼻塞鼻衄面瘫面痒', note: '手足阳明之会。禁灸。' },
  ],
  st: [
    { name: '承泣', pinyin: 'Chéngqì', number: 1, type: '', location: '瞳孔直下，眶下缘与眼球之间', indications: '目赤肿痛流泪夜盲眼睑瞤动', note: '禁灸。针刺宜轻。' },
    { name: '地仓', pinyin: 'Dìcāng', number: 4, type: '', location: '口角旁约0.4寸（约1.3厘米）', indications: '面瘫流涎三叉神经痛', note: '面瘫常用穴。' },
    { name: '天枢', pinyin: 'Tiānshū', number: 25, type: '大肠之募穴', location: '脐旁开2寸（约6.7厘米）', indications: '腹痛腹胀肠鸣泄泻便秘', note: '' },
    { name: '足三里', pinyin: 'Zúsānlǐ', number: 36, type: '合穴·胃下合穴', location: '犊鼻下3寸（约10厘米），胫骨前嵴外一横指', indications: '胃痛呕吐腹胀泄泻虚劳', note: '肚腹三里留。四总穴之一。保健要穴。合穴属土。' },
    { name: '丰隆', pinyin: 'Fēnglóng', number: 40, type: '络穴', location: '外踝尖上8寸（约26.6厘米），条口外一横指', indications: '咳嗽痰多头痛眩晕水肿', note: '化痰要穴。' },
    { name: '厉兑', pinyin: 'Lìduì', number: 45, type: '井穴', location: '第二趾外侧趾甲角旁约0.1寸（约0.3厘米）', indications: '齿痛咽痛多梦癫狂', note: '井穴属金。' },
  ],
  sp: [
    { name: '隐白', pinyin: 'Yǐnbái', number: 1, type: '井穴', location: '足大趾内侧趾甲角旁约0.1寸（约0.3厘米）', indications: '月经过多崩漏便血昏迷', note: '井穴属木。' },
    { name: '三阴交', pinyin: 'Sānyīnjiāo', number: 6, type: '', location: '内踝尖上3寸（约10厘米），胫骨内侧缘后方', indications: '月经不调遗精阳痿失眠腹胀', note: '足三阴经交会穴。孕妇禁针。' },
    { name: '阴陵泉', pinyin: 'Yīnlíngquán', number: 9, type: '合穴', location: '胫骨内侧髁下方凹陷处', indications: '腹胀泄泻水肿小便不利', note: '合穴属水。利水要穴。' },
    { name: '血海', pinyin: 'Xuèhǎi', number: 10, type: '', location: '髌底内侧端上2寸（约6.7厘米）', indications: '月经不调荨麻疹湿疹', note: '血证要穴。' },
  ],
  ht: [
    { name: '极泉', pinyin: 'Jíquán', number: 1, type: '', location: '腋窝顶点，腋动脉搏动处', indications: '心痛胸痹胁痛', note: '不宜大幅度提插。' },
    { name: '少海', pinyin: 'Shàohǎi', number: 3, type: '合穴', location: '屈肘时肘横纹内侧端与肱骨内上髁连线中点', indications: '心痛手颤肘臂挛痛', note: '合穴属水。心经子穴。' },
    { name: '神门', pinyin: 'Shénmén', number: 7, type: '输穴·原穴', location: '腕横纹尺侧端，尺侧腕屈肌腱桡侧凹陷中', indications: '心痛心烦失眠健忘癫狂', note: '安神要穴。' },
    { name: '少冲', pinyin: 'Shàochōng', number: 9, type: '井穴', location: '小指桡侧指甲角旁约0.1寸（约0.3厘米）', indications: '心悸心痛昏迷', note: '井穴属木。' },
  ],
  si: [
    { name: '少泽', pinyin: 'Shàozé', number: 1, type: '井穴', location: '小指尺侧指甲角旁约0.1寸（约0.3厘米）', indications: '乳腺炎缺乳头痛咽喉肿痛', note: '井穴属金。可点刺出血。' },
    { name: '后溪', pinyin: 'Hòuxī', number: 3, type: '输穴·八脉交会穴', location: '第五掌指关节后尺侧，掌横纹端', indications: '头项强痛目赤耳聋', note: '通督脉。' },
    { name: '养老', pinyin: 'Yǎnglǎo', number: 6, type: '郄穴', location: '尺骨小头近端桡侧凹陷中', indications: '目视不明肩背痛', note: '' },
    { name: '听宫', pinyin: 'Tīnggōng', number: 19, type: '', location: '耳屏前，下颌骨髁状突后方，张口凹陷处', indications: '耳鸣耳聋齿痛', note: '' },
  ],
  bl: [
    { name: '睛明', pinyin: 'Jīngmíng', number: 1, type: '', location: '目内眦角稍上方凹陷处', indications: '目赤肿痛目眩近视夜盲', note: '禁灸。出针后按压防止出血。' },
    { name: '肺俞', pinyin: 'Fèishù', number: 13, type: '背俞穴', location: '第三胸椎棘突下，旁开1.5寸（约5厘米）', indications: '咳嗽气喘咯血盗汗', note: '' },
    { name: '心俞', pinyin: 'Xīnshù', number: 15, type: '背俞穴', location: '第五胸椎棘突下，旁开1.5寸（约5厘米）', indications: '心痛心悸失眠健忘', note: '' },
    { name: '肝俞', pinyin: 'Gānshù', number: 18, type: '背俞穴', location: '第九胸椎棘突下，旁开1.5寸（约5厘米）', indications: '黄疸胁痛目赤目眩', note: '' },
    { name: '脾俞', pinyin: 'Píshù', number: 20, type: '背俞穴', location: '第十一胸椎棘突下，旁开1.5寸（约5厘米）', indications: '腹胀泄泻水肿黄疸', note: '' },
    { name: '肾俞', pinyin: 'Shènshù', number: 23, type: '背俞穴', location: '第二腰椎棘突下，旁开1.5寸（约5厘米）', indications: '腰痛遗精阳痿月经不调', note: '' },
    { name: '委中', pinyin: 'Wěizhōng', number: 40, type: '合穴', location: '腘窝横纹中点', indications: '腰背痛下肢痿痹腹痛', note: '腰背委中求。四总穴之一。' },
    { name: '承山', pinyin: 'Chéngshān', number: 57, type: '', location: '腓肠肌两肌腹间凹陷的顶端', indications: '腰腿痛痔疮便秘', note: '' },
    { name: '昆仑', pinyin: 'Kūnlún', number: 60, type: '经穴', location: '外踝尖与跟腱之间凹陷处', indications: '头痛项强目眩腰背痛', note: '' },
    { name: '至阴', pinyin: 'Zhìyīn', number: 67, type: '井穴', location: '足小趾外侧趾甲角旁约0.1寸（约0.3厘米）', indications: '头痛鼻塞目痛胎位不正', note: '井穴属金。艾灸可正胎位。' },
  ],
  ki: [
    { name: '涌泉', pinyin: 'Yǒngquán', number: 1, type: '井穴', location: '足底前1/3凹陷处，蜷足时足前部凹陷处', indications: '头痛眩晕失眠咽喉痛', note: '井穴属木。急救要穴。' },
    { name: '太溪', pinyin: 'Tàixī', number: 3, type: '输穴·原穴', location: '内踝尖与跟腱之间凹陷处', indications: '月经不调遗精阳痿腰痛耳鸣', note: '肾经原穴。滋阴要穴。' },
    { name: '照海', pinyin: 'Zhàohǎi', number: 6, type: '八脉交会穴', location: '内踝尖下方凹陷处', indications: '月经不调失眠咽干', note: '通阴跷脉。' },
    { name: '复溜', pinyin: 'Fùliū', number: 7, type: '经穴', location: '太溪直上2寸（约6.7厘米），跟腱前缘', indications: '水肿盗汗无汗', note: '经穴属金。肾经母穴。' },
  ],
  pc: [
    { name: '曲泽', pinyin: 'Qūzé', number: 3, type: '合穴', location: '肘横纹中，肱二头肌腱尺侧缘', indications: '心痛心悸胃痛呕吐', note: '合穴属水。' },
    { name: '内关', pinyin: 'Nèiguān', number: 6, type: '络穴·八脉交会穴', location: '腕横纹上2寸（约6.7厘米），掌长肌腱与桡侧腕屈肌腱之间', indications: '心痛心悸胸闷胃痛呕吐失眠', note: '通阴维脉。"心胸内关谋"。' },
    { name: '劳宫', pinyin: 'Láogōng', number: 8, type: '荥穴', location: '掌心第二三掌骨间，握拳时中指尖处', indications: '心痛呕吐口疮', note: '荥穴属火。' },
    { name: '中冲', pinyin: 'Zhōngchōng', number: 9, type: '井穴', location: '中指尖端中央', indications: '心痛昏迷舌强', note: '井穴属木。可点刺出血。' },
  ],
  sj: [
    { name: '外关', pinyin: 'Wàiguān', number: 5, type: '络穴·八脉交会穴', location: '腕背横纹上2寸（约6.7厘米），尺骨与桡骨之间', indications: '头痛耳聋耳鸣胁痛热病', note: '通阳维脉。' },
    { name: '支沟', pinyin: 'Zhīgōu', number: 6, type: '经穴', location: '腕背横纹上3寸（约10厘米），尺桡骨之间', indications: '便秘胁痛耳鸣', note: '便秘要穴。' },
    { name: '翳风', pinyin: 'Yìfēng', number: 17, type: '', location: '耳垂后方乳突与下颌角之间凹陷处', indications: '耳鸣耳聋面瘫齿痛', note: '' },
    { name: '丝竹空', pinyin: 'Sīzhúkōng', number: 23, type: '', location: '眉梢凹陷处', indications: '头痛目赤目眩', note: '禁灸。' },
  ],
  gb: [
    { name: '瞳子髎', pinyin: 'Tóngzǐliáo', number: 1, type: '', location: '目外眦外侧约0.5寸（约1.7厘米）凹陷处', indications: '头痛目赤目翳', note: '' },
    { name: '听会', pinyin: 'Tīnghuì', number: 2, type: '', location: '耳屏间切迹前方，下颌骨髁状突后缘', indications: '耳鸣耳聋齿痛面瘫', note: '' },
    { name: '风池', pinyin: 'Fēngchí', number: 20, type: '', location: '胸锁乳突肌与斜方肌上端之间凹陷处', indications: '头痛眩晕目赤鼻渊', note: '祛风要穴。不宜深刺。' },
    { name: '肩井', pinyin: 'Jiānjǐng', number: 21, type: '', location: '肩部大椎与肩峰连线的中点', indications: '肩背痛乳痈颈项强痛', note: '不宜深刺。孕妇禁针。' },
    { name: '环跳', pinyin: 'Huántiào', number: 30, type: '', location: '股骨大转子最高点与骶管裂孔连线的外1/3与内2/3交点处', indications: '下肢痿痹腰痛', note: '' },
    { name: '阳陵泉', pinyin: 'Yánglíngquán', number: 34, type: '合穴·筋会', location: '腓骨小头前下方凹陷处', indications: '胁痛口苦黄疸下肢痿痹', note: '筋会阳陵泉。合穴属土。' },
    { name: '悬钟', pinyin: 'Xuánzhōng', number: 39, type: '髓会', location: '外踝尖上3寸（约10厘米），腓骨前缘', indications: '颈项强痛头痛下肢痿痹', note: '髓会悬钟。' },
    { name: '足窍阴', pinyin: 'Zúqiàoyīn', number: 44, type: '井穴', location: '第四趾外侧趾甲角旁约0.1寸（约0.3厘米）', indications: '头痛耳聋目赤胁痛', note: '井穴属金。' },
  ],
  lv: [
    { name: '大敦', pinyin: 'Dàdūn', number: 1, type: '井穴', location: '足大趾外侧趾甲角旁约0.1寸（约0.3厘米）', indications: '疝气遗尿崩漏', note: '井穴属木。' },
    { name: '太冲', pinyin: 'Tàichōng', number: 3, type: '输穴·原穴', location: '足背第一二跖骨结合部之前的凹陷处', indications: '头痛眩晕胁痛月经不调', note: '疏肝要穴。常与合谷配"开四关"。' },
    { name: '期门', pinyin: 'Qīmén', number: 14, type: '肝之募穴', location: '乳头直下第六肋间', indications: '胸胁胀痛呕吐腹胀', note: '不宜深刺。' },
  ],
  cv: [
    { name: '会阴', pinyin: 'Huìyīn', number: 1, type: '', location: '男性当阴囊根部与肛门连线的中点', indications: '小便不利遗精月经不调', note: '任脉之起始穴。' },
    { name: '中极', pinyin: 'Zhōngjí', number: 3, type: '膀胱之募穴', location: '前正中线上脐下4寸（约13.3厘米）', indications: '遗尿小便不利遗精月经不调', note: '针刺宜排空尿液。' },
    { name: '关元', pinyin: 'Guānyuán', number: 4, type: '小肠之募穴', location: '前正中线上脐下3寸（约10厘米）', indications: '遗精阳痿月经不调虚劳', note: '保健要穴。壮元阳。' },
    { name: '气海', pinyin: 'Qìhǎi', number: 6, type: '', location: '前正中线上脐下1.5寸（约5厘米）', indications: '腹胀泄泻遗精虚脱', note: '补气要穴。' },
    { name: '中脘', pinyin: 'Zhōngwǎn', number: 12, type: '胃之募穴', location: '前正中线上脐上4寸（约13.3厘米）', indications: '胃痛呕吐腹胀', note: '腑会中脘。' },
  ],
  dv: [
    { name: '长强', pinyin: 'Chángqiáng', number: 1, type: '络穴', location: '尾骨尖下0.5寸（约1.7厘米）', indications: '痔疮脱肛泄泻', note: '' },
    { name: '命门', pinyin: 'Mìngmén', number: 4, type: '', location: '第二腰椎棘突下方凹陷中', indications: '腰痛遗精阳痿月经不调', note: '温肾壮阳要穴。' },
    { name: '大椎', pinyin: 'Dàzhuī', number: 14, type: '', location: '第七颈椎棘突下方凹陷中', indications: '热病头痛项强咳嗽', note: '诸阳之会。退热要穴。' },
    { name: '风府', pinyin: 'Fēngfǔ', number: 16, type: '', location: '后发际正中直上1寸（约3.3厘米）凹陷中', indications: '头痛项强眩晕', note: '不宜深刺。' },
    { name: '百会', pinyin: 'Bǎihuì', number: 20, type: '', location: '头顶正中，两耳尖连线的中点', indications: '头痛眩晕失眠脱肛', note: '诸阳之会。升阳举陷。' },
    { name: '水沟', pinyin: 'Shuǐgōu', number: 26, type: '', location: '人中沟的上1/3与下2/3交点处', indications: '昏迷休克口眼歪斜', note: '又名"人中"。急救要穴。' },
  ],
};

function renderAcupuncture() {
  // Render meridian menus
  const meridianList = document.getElementById('meridian-list');
  const extraList = document.getElementById('extra-meridian-list');
  if (!meridianList || !extraList) return;

  meridianList.innerHTML = meridiansData.map(m =>
    `<li class="${currentMeridian === m.id ? 'active' : ''}" onclick="selectMeridian('${m.id}')">${m.name}</li>`
  ).join('');

  extraList.innerHTML = extraMeridiansData.map(m =>
    `<li class="${currentExtraMeridian === m.id ? 'active' : ''}" onclick="selectExtraMeridian('${m.id}')">${m.name}</li>`
  ).join('');

  if (currentMeridian) renderAcupointsForMeridian(currentMeridian);
  else if (currentExtraMeridian) renderAcupointsForMeridian(currentExtraMeridian);
}

function selectMeridian(id) {
  currentMeridian = id;
  currentExtraMeridian = null;
  document.getElementById('meridian-list').querySelectorAll('li').forEach(l => l.classList.remove('active'));
  document.getElementById('meridian-list').querySelector(`li[onclick="selectMeridian('${id}')"]`)?.classList.add('active');
  document.getElementById('extra-meridian-list').querySelectorAll('li').forEach(l => l.classList.remove('active'));

  const meridian = meridiansData.find(m => m.id === id);
  if (meridian) {
    document.getElementById('acu-meridian-title').textContent = meridian.name;
  }
  renderAcupointsForMeridian(id);
}

function selectExtraMeridian(id) {
  currentExtraMeridian = id;
  currentMeridian = null;
  document.getElementById('extra-meridian-list').querySelectorAll('li').forEach(l => l.classList.remove('active'));
  document.getElementById('extra-meridian-list').querySelector(`li[onclick="selectExtraMeridian('${id}')"]`)?.classList.add('active');
  document.getElementById('meridian-list').querySelectorAll('li').forEach(l => l.classList.remove('active'));

  const meridian = extraMeridiansData.find(m => m.id === id);
  if (meridian) {
    document.getElementById('acu-meridian-title').textContent = meridian.name;
  }
  renderAcupointsForMeridian(id);
}

function renderAcupointsForMeridian(id) {
  const points = acupointsData[id] || [];
  const list = document.getElementById('acu-point-list');
  if (!list) return;

  if (points.length === 0) {
    const extra = extraMeridiansData.find(m => m.id === id);
    list.innerHTML = `<div style="padding:20px;color:var(--text-dim);"><p>${extra?.description || '暂无穴位数据'}</p></div>`;
    return;
  }

  list.innerHTML = points.map(p => `
    <div class="acu-point">
      <h4>${p.name} <span style="color:var(--text-dim);font-size:0.7rem;">${p.pinyin}</span></h4>
      <p>${p.type ? `<strong>${p.type}</strong>` : ''}${p.location ? ` · ${p.location}` : ''}</p>
      ${p.indications ? `<p>${p.indications}</p>` : ''}
      ${p.note ? `<div class="tags"><span class="tag">${p.note}</span></div>` : ''}
    </div>
  `).join('');
}

// ===== Meridians =====
function renderMeridians() {
  const detail = document.getElementById('meridian-detail');
  if (!detail) return;

  let html = '<div class="meridian-list">';
  meridiansData.forEach(m => {
    html += `<button class="meridian-chip" onclick="showMeridianDetail('${m.id}')">${m.name}</button>`;
  });
  html += '</div>';

  html += '<h4>奇经八脉</h4><div class="meridian-list">';
  extraMeridiansData.forEach(m => {
    html += `<button class="meridian-chip" onclick="showMeridianDetail('${m.id}')">${m.name}</button>`;
  });
  html += '</div>';

  html += '<div id="merdian-info" style="margin-top:16px;"><p style="color:var(--text-dim);">请点击经络查看详细循行路线</p></div>';

  detail.innerHTML = html;
}

function showMeridianDetail(id) {
  const info = document.getElementById('merdian-info');
  if (!info) return;

  // Highlight active chip
  document.querySelectorAll('.meridian-chip').forEach(c => c.classList.remove('active'));
  const chip = document.querySelector(`button[onclick="showMeridianDetail('${id}')"]`);
  if (chip) chip.classList.add('active');

  // Find meridian
  const m = meridiansData.find(mm => mm.id === id);
  if (m) {
    info.innerHTML = `
      <h4>${m.name}</h4>
      <p class="flow-path">气血流注时间：${m.time} | 五行属${m.fiveElement}</p>
      <p><strong>循行路线：</strong></p>
      <p>${m.flow}</p>
      <p class="acupoints-ref">本经穴位：${m.points}个 | <a href="#" onclick="showPage('acupuncture');setTimeout(()=>selectMeridian('${m.id}'),100);return false;" style="color:var(--accent);">查看穴位 →</a></p>
    `;
    return;
  }

  // Check extra meridians
  const em = extraMeridiansData.find(mm => mm.id === id);
  if (em) {
    info.innerHTML = `
      <h4>${em.name}</h4>
      <p>${em.description}</p>
      ${em.points > 0 ? `<p class="acupoints-ref">本经穴位：${em.points}个 | <a href="#" onclick="showPage('acupuncture');setTimeout(()=>selectExtraMeridian('${em.id}'),100);return false;" style="color:var(--accent);">查看穴位 →</a></p>` : ''}
    `;
  }
}

// ===== Classics Content =====

const shanghanContent = {
  1: { title: '太阳篇上', text: '太阳之为病，脉浮，头项强痛而恶寒。太阳病，发热汗出恶风脉缓者，名为中风。太阳病或已发热或未发热，必恶寒体痛呕逆脉阴阳俱紧者，名为伤寒。太阳中风，阳浮而阴弱，阳浮者热自发，阴弱者汗自出，啬啬恶寒淅淅恶风翕翕发热，鼻鸣干呕者，桂枝汤主之。' },
  2: { title: '太阳篇下', text: '太阳病三日，已发汗若吐若下若温针仍不解者，此为坏病，桂枝不中与之也。观其脉证，知犯何逆，随证治之。发汗后，不可更行桂枝汤，汗出而喘，无大热者，可与麻黄杏仁甘草石膏汤。' },
  3: { title: '阳明篇', text: '阳明之为病，胃家实是也。问曰阳明病外证云何，答曰身热汗自出不恶寒反恶热也。阳明病，脉迟，汗出多，微恶寒者，表未解也，可发汗，宜桂枝汤。阳明病，脉浮无汗而喘者，发汗则愈，宜麻黄汤。' },
  4: { title: '少阳篇', text: '少阳之为病，口苦咽干目眩也。伤寒五六日，中风，往来寒热，胸胁苦满，默默不欲饮食，心烦喜呕，或胸中烦而不呕，或渴或腹中痛或胁下痞硬或心下悸小便不利或不渴身有微热或咳者，小柴胡汤主之。' },
  5: { title: '太阴篇', text: '太阴之为病，腹满而吐，食不下，自利益甚，时腹自痛。若下之，必胸下结硬。自利不渴者，属太阴，以其脏有寒故也，当温之，宜服四逆辈。' },
  6: { title: '少阴篇', text: '少阴之为病，脉微细，但欲寐也。少阴病，欲吐不吐，心烦但欲寐，五六日自利而渴者，属少阴也，虚故引水自救，若小便色白者，少阴病形悉具，小便白者，以下焦虚有寒，不能制水故令色白也。' },
  7: { title: '厥阴篇', text: '厥阴之为病，消渴，气上撞心，心中疼热，饥而不欲食，食则吐蛔，下之利不止。凡厥者，阴阳气不相顺接，便为厥。厥者，手足逆冷是也。诸四逆厥者，不可下之，虚家亦然。' },
};

const jinkuiContent = {
  1: { title: '脏腑经络先后', text: '问曰：上工治未病，何也？师曰：夫治未病者，见肝之病，知肝传脾，当先实脾。四季脾旺不受邪，即勿补之。中工不晓相传，见肝之病，不解实脾，惟治肝也。夫肝之病，补用酸，助用焦苦，益用甘味之药调之。酸入肝，焦苦入心，甘入脾。脾能伤肾，肾气微弱，则水不行；水不行，则心火气盛；心火气盛，则伤肺；肺被伤，则金气不行；金气不行，则肝气盛。故实脾，则肝自愈。此治肝补脾之要妙也。肝虚则用此法，实则不在用之。经曰：虚虚实实，补不足，损有余，是其义也。余脏准此。' },
  2: { title: '痉湿暍', text: '太阳病，发热无汗，反恶寒者，名曰刚痉。太阳病，发热汗出，而不恶寒，名曰柔痉。太阳病，发热，脉沉而细者，名曰痉，为难治。太阳病，发汗太多，因致痉。夫风病，下之则痉，复发汗，必拘急。疮家虽身疼痛，不可发汗，汗出则痉。病者身热足寒，颈项强急，恶寒，时头热，面赤目赤，独头动摇，卒口噤，背反张者，痉病也。\n湿家之为病，一身尽疼，发热，身色如熏黄也。湿家，其人但头汗出，背强，欲得被覆向火。若下之早则哕，或胸满，小便不利，舌上如胎者，以丹田有热，胸上有寒，渴欲得饮而不能饮，则口燥烦也。\n太阳中热者，暍是也。汗出恶寒，身热而渴，白虎加人参汤主之。' },
  3: { title: '百合狐惑阴阳毒', text: '百合病者，百脉一宗，悉致其病也。意欲食复不能食，常默默，欲卧不能卧，欲行不能行，饮食或有美时，或有不用闻食臭时。如寒无寒，如热无热，口苦小便赤，诸药不能治，得药则剧吐利，如有神灵者，身形如和，其脉微数。百合病，发汗后者，百合知母汤主之。百合病，下之后者，滑石代赭汤主之。百合病，吐之后者，百合鸡子汤主之。\n狐惑之为病，状如伤寒，默默欲眠，目不得闭，卧起不安。蚀于喉为惑，蚀于阴为狐。不欲饮食，恶闻食臭，其面目乍赤、乍黑、乍白。蚀于上部则声喝，甘草泻心汤主之。蚀于下部则咽干，苦参汤洗之。\n阳毒之为病，面赤斑斑如锦纹，咽喉痛，唾脓血，升麻鳖甲汤主之。阴毒之为病，面目青，身痛如被杖，咽喉痛，升麻鳖甲汤去雄黄蜀椒主之。' },
  4: { title: '疟病', text: '师曰：疟脉自弦，弦数者多热，弦迟者多寒。弦小紧者下之差，弦迟者可温之，弦紧者可发汗针灸也，浮大者可吐之，弦数者风发也，以饮食消息止之。\n病疟以月一日发，当以十五日愈；设不差，当月尽解；如其不差，当云何？师曰：此结为癥瘕，名曰疟母，急治之，宜鳖甲煎丸。' },
  5: { title: '中风历节', text: '夫风之为病，当半身不遂，或但臂不遂者，此为痹。脉微而数，中风使然。\n寸口脉浮而紧，紧则为寒，浮则为虚；寒虚相搏，邪在皮肤；浮者血虚，络脉空虚；贼邪不泻，或左或右；邪气反缓，正气即急，正气引邪，喎僻不遂。邪在于络，肌肤不仁；邪在于经，即重不胜；邪入于府，即不识人；邪入于脏，舌即难言，口吐涎。\n诸肢节疼痛，身体魁羸，脚肿如脱，头眩短气，温温欲吐，桂枝芍药知母汤主之。' },
  6: { title: '血痹虚劳', text: '问曰：血痹病从何得之？师曰：夫尊荣人，骨弱肌肤盛，重因疲劳汗出，卧不时动摇，加被微风，遂得之。但以脉自微涩，在寸口、关上小紧，宜针引阳气，令脉和紧去则愈。血痹阴阳俱微，寸口关上微，尺中小紧，外证身体不仁如风痹状，黄芪桂枝五物汤主之。\n夫失精家，少腹弦急，阴头寒，目眩发落，脉极虚芤迟，为清谷亡血失精。脉得诸芤动微紧，男子失精，女子梦交，桂枝加龙骨牡蛎汤主之。\n虚劳里急，悸，衄，腹中痛，梦失精，四肢酸疼，手足烦热，咽干口燥，小建中汤主之。虚劳腰痛，少腹拘急，小便不利者，八味肾气丸主之。虚劳诸不足，风气百疾，薯蓣丸主之。虚劳虚烦不得眠，酸枣仁汤主之。五劳虚极羸瘦，腹满不能饮食，内有干血，肌肤甲错，两目黯黑，大黄蛰虫丸主之。' },
  7: { title: '肺痿肺痈咳嗽上气', text: '问曰：热在上焦者，因咳为肺痿。肺痿之病，从何得之？师曰：或从汗出，或从呕吐，或从消渴，小便利数，或从便难，又被快药下利，重亡津液，故得之。寸口脉数，其人咳，口中反有浊唾涎沫者何？师曰：为肺痿之病。\n咳而胸满，振寒脉数，咽干不渴，时出浊唾腥臭，久久吐脓如米粥者，为肺痈，桔梗汤主之。\n咳而上气，喉中水鸡声，射干麻黄汤主之。咳逆上气，时时吐浊，但坐不得眠，皂荚丸主之。大逆上气，咽喉不利，止逆下气者，麦门冬汤主之。' },
  8: { title: '奔豚气', text: '师曰：奔豚病，从少腹起，上冲咽喉，发作欲死，复还止，皆从惊恐得之。奔豚气上冲胸，腹痛，往来寒热，奔豚汤主之。发汗后，烧针令其汗，针处被寒，核起而赤者，必发奔豚，气从少腹上至心，灸其核上各一壮，与桂枝加桂汤主之。发汗后，脐下悸者，欲作奔豚，茯苓桂枝甘草大枣汤主之。' },
  9: { title: '胸痹心痛短气', text: '夫脉当取太过不及，阳微阴弦，即胸痹而痛。所以然者，责其极虚也。今阳虚知在上焦，所以胸痹心痛者，以其阴弦故也。胸痹之病，喘息咳唾，胸背痛，短气，寸口脉沉而迟，关上小紧数，栝楼薤白白酒汤主之。胸痹不得卧，心痛彻背者，栝楼薤白半夏汤主之。胸痹心中痞，留气结在胸，胸满，胁下逆抢心，枳实薤白桂枝汤主之；人参汤亦主之。胸痹缓急者，薏苡附子散主之。心中痞，诸逆心悬痛，桂枝生姜枳实汤主之。心痛彻背，背痛彻心，乌头赤石脂丸主之。' },
  10: { title: '腹满寒疝宿食', text: '趺阳脉微弦，法当腹满，不满者必便难，两胠疼痛，此虚寒从下上也，当以温药服之。病者腹满，按之不痛为虚，痛者为实，可下之。舌黄未下者，下之黄自去。腹满时减，复如故，此为寒，当与温药。\n心胸中大寒痛，呕不能饮食，腹中寒，上冲皮起，出见有头足，上下痛而不可触近，大建中汤主之。胁下偏痛，发热，其脉紧弦，此寒也，以温药下之，宜大黄附子汤。\n腹痛，脉弦而紧，弦则卫气不行，即恶寒，紧则不欲食，邪正相搏，即为寒疝。寒疝绕脐痛，若发则白汗出，手足厥冷，其脉沉紧者，大乌头煎主之。' },
  11: { title: '五脏风寒积聚', text: '肺中风者，口燥而喘，身运而重，冒而肿胀。肺中寒，吐浊涕。肝中风者，头目瞤，两胁痛，行常伛，令人嗜甘。肝中寒者，两臂不举，舌本燥，喜太息，胸中痛，不得转侧，食则吐而汗出也。心中风者，翕翕发热，不能起，心中饥，食即呕吐。心中寒者，其人苦病心如啖蒜状，剧者心痛彻背，背痛彻心，譬如蛊注。' },
  12: { title: '痰饮咳嗽', text: '问曰：夫饮有四，何谓也？师曰：有痰饮，有悬饮，有溢饮，有支饮。其人素盛今瘦，水走肠间，沥沥有声，谓之痰饮。饮后水流在胁下，咳唾引痛，谓之悬饮。饮水流行归于四肢，当汗出而不汗出，身体疼重，谓之溢饮。咳逆倚息，短气不得卧，其形如肿，谓之支饮。\n病痰饮者，当以温药和之。心下有痰饮，胸胁支满，目眩，苓桂术甘汤主之。夫短气有微饮，当从小便去之，苓桂术甘汤主之；肾气丸亦主之。\n病悬饮者，十枣汤主之。病溢饮者，当发其汗，大青龙汤主之；小青龙汤亦主之。' },
  13: { title: '消渴小便不利淋病', text: '厥阴之为病，消渴，气上冲心，心中疼热，饥而不欲食，食即吐蛔，下之不肯止。寸口脉浮而迟，浮即为虚，迟即为劳；虚则卫气不足，劳则荣气竭。趺阳脉浮而数，浮即为气，数即消谷而大坚；气盛则溲数，溲数即坚，坚数相搏，即为消渴。男子消渴，小便反多，以饮一斗，小便一斗，肾气丸主之。\n小便不利者，有水气，其人苦渴，栝楼瞿麦丸主之。小便不利，蒲灰散主之；滑石白鱼散、茯苓戎盐汤并主之。' },
  14: { title: '水气病', text: '师曰：病有风水、有皮水、有正水、有石水、有黄汗。风水其脉自浮，外证骨节疼痛，恶风；皮水其脉亦浮，外证胕肿，按之没指，不恶风，其腹如鼓，不渴，当发其汗。正水其脉沉迟，外证自喘；石水其脉自沉，外证腹满不喘。黄汗其脉沉迟，身发热，胸满，四肢头面肿，久不愈，必致痈脓。\n风水，脉浮身重，汗出恶风者，防己黄芪汤主之。风水恶风，一身悉肿，脉浮不渴，续自汗出，无大热，越婢汤主之。皮水为病，四肢肿，水气在皮肤中，四肢聂聂动者，防己茯苓汤主之。' },
  15: { title: '黄疸病', text: '寸口脉浮而缓，浮则为风，缓则为痹。痹非中风，四肢苦烦，脾色必黄，瘀热以行。趺阳脉紧而数，数则为热，热则消谷；紧则为寒，食即为满。尺脉浮为伤肾，趺阳脉紧为伤脾。风寒相搏，食谷即眩，谷气不消，胃中苦浊，浊气下流，小便不通，身体尽黄，名曰谷疸。\n额上黑，微汗出，手足中热，薄暮即发，膀胱急，小便自利，名曰女劳疸，腹如水状不治。心中懊恼而热，不能食，时欲吐，名曰酒疸。\n谷疸之为病，寒热不食，食即头眩，心胸不安，久久发黄为谷疸，茵陈蒿汤主之。黄疸病，茵陈五苓散主之。' },
};

const neijingContent = {
  1: { title: '上古天真论', text: '昔在黄帝，生而神灵，弱而能言，幼而徇齐，长而敦敏，成而登天。乃问于天师曰：余闻上古之人，春秋皆度百岁，而动作不衰；今时之人，年半百而动作皆衰者，时世异耶？人将失之耶？岐伯对曰：上古之人，其知道者，法于阴阳，和于术数，食饮有节，起居有常，不妄作劳，故能形与神俱，而尽终其天年，度百岁乃去。今时之人不然也，以酒为浆，以妄为常，醉以入房，以欲竭其精，以耗散其真，不知持满，不时御神，务快其心，逆于生乐，起居无节，故半百而衰也。\n夫上古圣人之教下也，皆谓之虚邪贼风，避之有时，恬淡虚无，真气从之，精神内守，病安从来。是以志闲而少欲，心安而不惧，形劳而不倦，气从以顺，各从其欲，皆得所愿。\n帝曰：人年老而无子者，材力尽邪？将天数然也？岐伯曰：女子七岁，肾气盛，齿更发长。二七而天癸至，任脉通，太冲脉盛，月事以时下，故有子。三七肾气平均，故真牙生而长极。四七筋骨坚，发长极，身体盛壮。五七阳明脉衰，面始焦，发始堕。六七三阳脉衰于上，面皆焦，发始白。七七任脉虚，太冲脉衰少，天癸竭，地道不通，故形坏而无子也。丈夫八岁，肾气实，发长齿更。二八肾气盛，天癸至，精气溢泻，阴阳和，故能有子。三八肾气平均，筋骨劲强，故真牙生而长极。四八筋骨隆盛，肌肉满壮。五八肾气衰，发堕齿槁。六八阳气衰竭于上，面焦，发鬓颁白。七八肝气衰，筋不能动，天癸竭，精少，肾脏衰，形体皆极。八八则齿发去。' },
  2: { title: '四气调神大论', text: '春三月，此谓发陈。天地俱生，万物以荣。夜卧早起，广步于庭，被发缓形，以使志生；生而勿杀，予而勿夺，赏而勿罚，此春气之应，养生之道也。逆之则伤肝，夏为寒变，奉长者少。\n夏三月，此谓蕃秀。天地气交，万物华实。夜卧早起，无厌于日，使志无怒，使华英成秀，使气得泄，若所爱在外，此夏气之应，养长之道也。逆之则伤心，秋为痎疟，奉收者少，冬至重病。\n秋三月，此谓容平。天气以急，地气以明。早卧早起，与鸡俱兴，使志安宁，以缓秋刑，收敛神气，使秋气平，无外其志，使肺气清，此秋气之应，养收之道也。逆之则伤肺，冬为飧泄，奉藏者少。\n冬三月，此谓闭藏。水冰地坼，无扰乎阳。早卧晚起，必待日光，使志若伏若匿，若有私意，若已有得，去寒就温，无泄皮肤，使气亟夺，此冬气之应，养藏之道也。逆之则伤肾，春为痿厥，奉生者少。\n夫四时阴阳者，万物之根本也。所以圣人春夏养阳，秋冬养阴，以从其根。故阴阳四时者，万物之终始也，死生之本也。逆之则灾害生，从之则苛疾不起，是谓得道。道者，圣人行之，愚者佩之。从阴阳则生，逆之则死；从之则治，逆之则乱。是故圣人不治已病治未病，不治已乱治未乱，此之谓也。夫病已成而后药之，乱已成而后治之，譬犹渴而穿井，斗而铸锥，不亦晚乎！' },
  3: { title: '生气通天论', text: '黄帝曰：夫自古通天者，生之本，本于阴阳。天地之间，六合之内，其气九州、九窍、五脏、十二节，皆通乎天气。其生五，其气三，数犯此者，则邪气伤人，此寿命之本也。\n苍天之气，清净则志意治，顺之则阳气固，虽有贼邪，弗能害也。故圣人传精神，服天气，而通神明。失之则内闭九窍，外壅肌肉，卫气散解，此谓自伤，气之削也。\n阳气者，若天与日，失其所，则折寿而不彰。故天运当以日光明，是故阳因而上，卫外者也。因于寒，欲如运枢，起居如惊，神气乃浮。因于暑，汗，烦则喘喝，静则多言，体若燔炭，汗出而散。因于湿，首如裹，湿热不攘，大筋软短，小筋弛长，软短为拘，弛长为痿。因于气，为肿，四维相代，阳气乃竭。\n阳气者，烦劳则张，精绝，辟积于夏，使人煎厥。目盲不可以视，耳闭不可以听，溃溃乎若坏都，汩汩乎不可止。阳气者，大怒则形气绝，而血菀于上，使人薄厥。有伤于筋，纵，其若不容。汗出偏沮，使人偏枯。汗出见湿，乃生痤疿。高粱之变，足生大疔，受如持虚。劳汗当风，寒薄为皶，郁乃痤。\n阴者，藏精而起亟也；阳者，卫外而为固也。阴不胜其阳，则脉流薄疾，并乃狂。阳不胜其阴，则五脏气争，九窍不通。是以圣人陈阴阳，筋脉和同，骨髓坚固，气血皆从。如是则内外调和，邪不能害，耳目聪明，气立如故。' },
  4: { title: '阴阳应象大论', text: '黄帝曰：阴阳者，天地之道也，万物之纲纪，变化之父母，生杀之本始，神明之府也。治病必求于本。故积阳为天，积阴为地。阴静阳躁，阳生阴长，阳杀阴藏。阳化气，阴成形。寒极生热，热极生寒。寒气生浊，热气生清。清气在下，则生飧泄；浊气在上，则生䐜胀。此阴阳反作，病之逆从也。\n故清阳为天，浊阴为地。地气上为云，天气下为雨。故清阳出上窍，浊阴出下窍；清阳发腠理，浊阴走五脏；清阳实四肢，浊阴归六腑。水为阴，火为阳。阳为气，阴为味。味归形，形归气，气归精，精归化。精食气，形食味，化生精，气生形。味伤形，气伤精。精化为气，气伤于味。\n风胜则动，热胜则肿，燥胜则干，寒胜则浮，湿胜则濡泻。天有四时五行，以生长收藏，以生寒暑燥湿风。人有五脏化五气，以生喜怒悲忧恐。故喜怒伤气，寒暑伤形。暴怒伤阴，暴喜伤阳。厥气上行，满脉去形。喜怒不节，寒暑过度，生乃不固。\n故曰：天地者，万物之上下也；阴阳者，血气之男女也；左右者，阴阳之道路也；水火者，阴阳之征兆也；阴阳者，万物之能始也。故曰：阴在内，阳之守也；阳在外，阴之使也。' },
  5: { title: '灵兰秘典论', text: '黄帝问曰：愿闻十二脏之相使，贵贱何如？岐伯对曰：心者，君主之官也，神明出焉。肺者，相傅之官，治节出焉。肝者，将军之官，谋虑出焉。胆者，中正之官，决断出焉。膻中者，臣使之官，喜乐出焉。脾胃者，仓廪之官，五味出焉。大肠者，传道之官，变化出焉。小肠者，受盛之官，化物出焉。肾者，作强之官，伎巧出焉。三焦者，决渎之官，水道出焉。膀胱者，州都之官，津液藏焉，气化则能出矣。凡此十二官者，不得相失也。故主明则下安，以此养生则寿，殁世不殆，以为天下则大昌。主不明则十二官危，使道闭塞而不通，形乃大伤，以此养生则殃，以为天下者，其宗大危，戒之戒之！' },
  6: { title: '本神（灵枢）', text: '黄帝问于岐伯曰：凡刺之法，先必本于神。何谓德、气、生、精、神、魂、魄、心、意、志、思、智、虑？岐伯答曰：天之在我者德也，地之在我者气也。德流气薄而生者也。故生之来谓之精，两精相搏谓之神，随神往来者谓之魂，并精而出入者谓之魄，所以任物者谓之心，心有所忆谓之意，意之所存谓之志，因志而存变谓之思，因思而远慕谓之虑，因虑而处物谓之智。\n肝藏血，血舍魂，肝气虚则恐，实则怒。脾藏营，营舍意，脾气虚则四肢不用，五脏不安，实则腹胀，经溲不利。心藏脉，脉舍神，心气虚则悲，实则笑不休。肺藏气，气舍魄，肺气虚则鼻塞不利少气，实则喘喝胸盈仰息。肾藏精，精舍志，肾气虚则厥，实则胀，五脏不安。必审五脏之病形，以知其气之虚实，谨而调之也。' },
};

const shennongContent = {
  1: { title: '上品·玉石部', text: '【丹砂】味甘，微寒。主身体五脏百病，养精神，安魂魄，益气明目，杀精魅邪恶鬼。久服通神明不老。\n【云母】味甘，平。主身皮死肌，中风寒热，如在车船上，除邪气，安五脏，益子精，明目。久服轻身延年。\n【玉泉】味甘，平。主五脏百病，柔筋强骨，安魂魄，长肌肉，益气。久服耐寒暑，不饥渴，不老神仙。\n【石钟乳】味甘，温。主咳逆上气，明目益精，安五脏，通百节，利九窍，下乳汁。\n【矾石】味酸，寒。主寒热泄利，白沃阴蚀，恶疮目痛，坚骨齿。炼饵服之，轻身不老增年。\n【硝石】味苦，寒。主五脏积热，胃胀闭，涤去蓄结饮食，推陈致新，除邪气。炼之如膏，久服轻身。\n【朴硝】味苦，寒。主百病，除寒热邪气，逐六腑积聚，结固留癖，能化七十二种石。炼饵服之，轻身神仙。\n【滑石】味甘，寒。主身热泄澼，女子乳难，癃闭，利小便，荡胃中积聚寒热，益精气。久服轻身耐饥长年。\n【禹余粮】味甘，寒。主咳逆寒热烦满，下赤白血闭，癥瘕大热。炼饵服之，不饥轻身延年。' },
  2: { title: '上品·草部', text: '【人参】味甘，微寒。主补五脏，安精神，定魂魄，止惊悸，除邪气，明目，开心益智。久服轻身延年。一名人衔，一名鬼盖。生山谷。\n【甘草】味甘，平。主五脏六腑寒热邪气，坚筋骨，长肌肉，倍力，金疮肿，解毒。久服轻身延年。生川谷。\n【干地黄】味甘，寒。主折跌绝筋，伤中，逐血痹，填骨髓，长肌肉。作汤除寒热积聚，除痹。生者尤良。久服轻身不老。\n【白术】味苦，温。主风寒湿痹，死肌痉疸，止汗除热消食。作煎饵。久服轻身延年不饥。一名山蓟。生山谷。\n【菟丝子】味辛，平。主续绝伤，补不足，益气力，肥健。汁去面皯。久服明目轻身延年。\n【牛膝】味苦，酸。主寒湿痿痹，四肢拘挛，膝痛不可屈伸，逐血气，伤热火烂，堕胎。久服轻身耐老。\n【柴胡】味苦，平。主心腹，去肠胃中结气，饮食积聚，寒热邪气，推陈致新。久服轻身明目益精。\n【麦门冬】味甘，平。主心腹结气，伤中伤饱，胃络脉绝，羸瘦短气。久服轻身不老不饥。\n【独活】味苦，平。主风寒所击，金疮止痛，奔豚痫痓，女子疝瘕。久服轻身耐老。一名羌活，一名羌青，一名护羌使者。\n【车前子】味甘，寒。主气癃，止痛，利水道小便，除湿痹。久服轻身耐老。\n【薯蓣】味甘，温。主伤中，补虚羸，除寒热邪气，补中益气力，长肌肉。久服耳目聪明，轻身不饥延年。一名山芋。' },
  3: { title: '中品·草部', text: '【当归】味甘，温。主咳逆上气，温疟寒热洗洗在皮肤中。妇人漏下绝子。诸恶疮疡金疮。煮饮之。一名干归。\n【麻黄】味苦，温。主中风伤寒头痛，温疟，发表出汗，去邪热气，止咳逆上气，除寒热，破癥坚积聚。一名龙沙。\n【芍药】味苦，平。主邪气腹痛，除血痹，破坚积寒热疝瘕，止痛，利小便，益气。\n【黄芩】味苦，平。主诸热黄疸，肠澼泄利，逐水，下血闭，恶疮疽蚀火疡。一名腐肠。\n【黄连】味苦，寒。主热气目痛，眦伤泣出，明目，肠澼腹痛下利，妇人阴中肿痛。久服令人不忘。一名王连。\n【葛根】味甘，平。主消渴，身大热，呕吐，诸痹，起阴气，解诸毒。一名鸡齐根。\n【知母】味苦，寒。主消渴热中，除邪气，肢体浮肿，下水，补不足，益气。一名蚳母。\n【贝母】味辛，平。主伤寒烦热，淋沥邪气，疝瘕，喉痹，乳难，金疮风痉。一名空草。\n【白芷】味辛，温。主女人漏下赤白，血闭阴肿，寒热风头，侵目泪出，长肌肤，润泽，可作面脂。一名芳香。\n【秦艽】味苦，平。主寒热邪气，寒湿风痹，肢节痛，下水利小便。\n【百合】味甘，平。主邪气腹胀心痛，利大小便，补中益气。' },
  4: { title: '下品·草部', text: '【大黄】味苦，寒。主下瘀血，血闭寒热，破癥瘕积聚，留饮宿食，荡涤肠胃，推陈致新，通利水谷，调中化食，安和五脏。\n【附子】味辛，温。主风寒咳逆邪气，温中，金疮，破癥坚积聚血瘕，寒湿痿躄拘挛膝痛，不能行步。\n【乌头】味辛，温。主中风恶风，洗洗出汗，除寒湿痹，咳逆上气，破积聚寒热。其汁煎之，名射罔，杀禽兽。\n【半夏】味辛，平。主伤寒寒热，心下坚，下气，喉咽肿痛，头眩，胸胀，咳逆，肠鸣，止汗。一名地文，一名水玉。\n【葶苈】味辛，寒。主癥瘕积聚结气，饮食寒热，破坚逐邪，通利水道。一名大室，一名大适。\n【桔梗】味辛，微温。主胸胁痛如刀刺，腹满肠鸣幽幽，惊恐悸气。\n【巴豆】味辛，温。主伤寒温疟寒热，破癥瘕结聚坚积，留饮痰癖，大腹水胀，荡练五脏六腑，开通闭塞，利水谷道，去恶肉，除鬼毒蛊疰邪物。\n【甘遂】味苦，寒。主大腹疝瘕，腹满，面目浮肿，留饮宿食，破癥坚积聚，利水谷道。\n【大戟】味苦，寒。主蛊毒，十二水，腹满急痛积聚，中风，皮肤疼痛，吐逆。\n【芫花】味辛，温。主咳逆上气，喉鸣喘，咽肿短气，蛊毒鬼疟，疝瘕痈肿，杀虫鱼。' },
  5: { title: '中品·木部', text: '【桂枝】味辛，温。主上气咳逆，结气喉痹吐吸，利关节，补中益气。久服通神，轻身不老。\n【枳实】味苦，寒。主大风在皮肤中如麻豆苦痒，除寒热结，止利，长肌肉，利五脏，益气轻身。\n【山茱萸】味酸，平。主心下邪气寒热，温中，逐寒湿痹，去三虫。久服轻身。\n【吴茱萸】味辛，温。主温中下气，止痛，咳逆寒热，除湿血痹，逐风邪，开腠理。\n【厚朴】味苦，温。主中风伤寒头痛，寒热惊悸，气血痹，死肌，去三虫。\n【秦皮】味苦，微寒。主风寒湿痹，洗洗寒气，除热，目中青翳白膜。久服头不白，轻身。\n【栀子】味苦，寒。主五内邪气，胃中热气，面赤，酒疱皶鼻，白癞赤癞，疮疡。\n【竹叶】味苦，平。主咳逆上气，溢筋急，恶疡，杀小虫。\n【猪苓】味甘，平。主痎疟，解毒蛊疰不祥，利水道。久服轻身耐老。\n【茯苓】味甘，平。主胸胁逆气，忧恚惊邪恐悸，心下结痛，寒热烦满咳逆，口焦舌干，利小便。久服安魂养神，不饥延年。' },
};

function renderClassicContent() {
  let content, containerId;
  if (currentClassic === 'shanghan') {
    content = shanghanContent[currentVolume] || { title: '', text: '（这一篇的内容将在后续版本中补充）' };
    containerId = 'classic-content';
  } else if (currentClassic === 'jinkui') {
    content = jinkuiContent[currentVolume] || { title: '', text: '（这一篇的内容将在后续版本中补充）' };
    containerId = 'jinkui-content';
  } else if (currentClassic === 'neijing') {
    content = neijingContent[currentVolume] || { title: '', text: '（这一篇的内容将在后续版本中补充）' };
    containerId = 'neijing-content';
  } else if (currentClassic === 'shennong') {
    content = shennongContent[currentVolume] || { title: '', text: '（这一篇的内容将在后续版本中补充）' };
    containerId = 'shennong-content';
  } else {
    return;
  }

  const container = document.getElementById(containerId);
  if (container) {
    // Split by newlines and format as individual clauses
    const paragraphs = content.text.split('\n').filter(p => p.trim());
    container.innerHTML = paragraphs.map(p => 
      `<div class="clause"><span class="clause-text">${p}</span></div>`
    ).join('');
  }
}

// ===== Global Search =====
function handleGlobalSearch(e) {
  const q = e.target.value.toLowerCase().trim();
  if (!q) return;

  // Search in formulas
  if (formulasData.some(f => f.name.toLowerCase() === q)) {
    showPage('formulas');
    document.getElementById('formula-search').value = q;
    renderFormulas();
    return;
  }

  // Search in herbs
  if (herbsData.some(h => h.name.toLowerCase() === q)) {
    showPage('herbs');
    document.getElementById('herb-search').value = q;
    renderHerbs();
    return;
  }

  // Search in meridians
  const m = meridiansData.find(m => m.name.includes(q) || m.id === q);
  if (m) {
    showPage('meridians');
    setTimeout(() => showMeridianDetail(m.id), 200);
  }
}

// Make functions globally accessible for onclick handlers
window.selectMeridian = selectMeridian;
window.selectExtraMeridian = selectExtraMeridian;
window.showMeridianDetail = showMeridianDetail;
window.showPage = showPage;
