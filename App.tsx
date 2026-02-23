
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { EditorContent, useEditor, Extension } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons, COVER_COLORS, COLORS } from './constants';
import { Book, ViewState, Note, BookSection } from './types';

// --- INDEXED DB ENGINE ---
const DB_NAME = 'ArchibookStudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'books';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const saveBookToDB = async (book: Book) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(book);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getAllBooksFromDB = async (): Promise<Book[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteBookFromDB = async (id: string) => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).delete(id);
};

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: element => element.style.fontSize,
          renderHTML: attributes => attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize: () => ({ chain }: any) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

const FONT_FAMILIES = [
  { name: 'GARAMOND', value: "'EB Garamond', serif" },
  { name: 'SPECTRAL', value: "'Spectral', serif" },
  { name: 'LORA', value: "'Lora', serif" },
  { name: 'PLAYFAIR', value: "'Playfair Display', serif" },
  { name: 'INTER', value: "'Inter', sans-serif" },
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'];

// --- CONTENT VOL 1 (Full) ---
const VOL1_SECTIONS: BookSection[] = [
  {
    id: 'v1-sec-title',
    title: 'TRANG TÊN SÁCH (T1)',
    content: `
      <div style="text-align: center; margin-top: 150px;">
        <h1 style="font-size: 3.5rem; letter-spacing: -0.05em; font-weight: 800;">KIẾN TRÚC SƯ QUẢN TRỊ</h1>
        <h2 style="font-size: 1.5rem; font-weight: 300; color: #666; letter-spacing: 0.3em; margin-bottom: 3rem;">CHIẾN LƯỢC VÀ VẬN HÀNH TINH HOA</h2>
        <div style="width: 40px; height: 1px; background: #000; margin: 0 auto 3rem;"></div>
        <p style="font-size: 1.1rem; font-style: italic; color: #444; margin-bottom: 4rem;">Giáo trình MBA thực chiến dành cho<br/>Firm Principals & Quản lý cấp trung ngành AEC</p>
        <p style="font-size: 1.2rem; font-weight: 600;">Tác giả: Hoàng Trịnh Đăng & AI</p>
      </div>
    `,
    notes: []
  },
  {
    id: 'v1-sec-copyright',
    title: 'TRANG BẢN QUYỀN',
    content: `
      <div style="font-size: 0.9rem; line-height: 1.6; color: #444;">
        <p><strong>KIẾN TRÚC SƯ QUẢN TRỊ: CHIẾN LƯỢC VÀ VẬN HÀNH TINH HOA</strong></p>
        <p>Giáo trình MBA thực chiến dành cho Firm Principals & Quản lý cấp trung ngành AEC</p>
        <p>Tác giả: Hoàng Trịnh Đăng & AI</p>
        <p>Biên tập nội dung: Hoàng Trịnh Đăng</p>
        <p>© Bản quyền thuộc về tác giả.</p>
        <p>Mọi hình thức sao chép, trích dẫn, in ấn hoặc phát hành lại một phần hay toàn bộ nội dung cuốn sách này dưới bất kỳ hình thức nào đều phải được sự đồng ý bằng văn bản của tác giả, trừ trường hợp trích dẫn cho mục đích nghiên cứu, phê bình theo quy định của pháp luật.</p>
        <p>In tại Việt Nam. Năm xuất bản: ………</p>
      </div>
    `,
    notes: []
  },
  {
    id: 'v1-sec-thanks',
    title: 'LỜI CẢM ƠN',
    content: `
      <h2>LỜI CẢM ƠN</h2>
      <p>Cuốn sách này không được viết trong sự tách biệt, mà được hình thành từ nhiều năm quan sát, đối thoại và va chạm với thực tế hành nghề kiến trúc tại Việt Nam.</p>
      <p>Trước hết, tác giả xin gửi lời cảm ơn đến những kiến trúc sư đã và đang điều hành văn phòng – những người vừa làm nghề, vừa gánh trên vai trách nhiệm của một tổ chức.</p>
      <p>Xin cảm ơn các cộng sự, quản lý dự án, quản lý cấp trung trong các văn phòng kiến trúc – những người đứng ở tuyến giữa, nơi chiến lược gặp thực tế, nơi áp lực gặp con người.</p>
      <p>Cuối cùng, xin cảm ơn những người làm nghề đang đọc cuốn sách này. Việc bạn chọn dừng lại để suy nghĩ về quản trị đã là một quyết định can đảm.</p>
    `,
    notes: []
  },
  {
    id: 'v1-sec-author',
    title: 'GIỚI THIỆU TÁC GIẢ',
    content: `
      <h2>GIỚI THIỆU TÁC GIẢ</h2>
      <h3>Hoàng Trịnh Đăng</h3>
      <p>Hoàng Trịnh Đăng là kiến trúc sư và nhà tư vấn quản trị trong ngành AEC, với kinh nghiệm nhiều năm làm việc tại các văn phòng kiến trúc và tham gia xây dựng, tái cấu trúc mô hình vận hành cho các firm thiết kế tại Việt Nam.</p>
      <p>Công việc của ông tập trung vào ba trục chính: Tư duy chiến lược, Quản trị vận hành/tài chính, và Phát triển năng lực lãnh đạo.</p>
      <h3>AI (Trí tuệ nhân tạo)</h3>
      <p>AI trong cuốn sách này được sử dụng như một đối tác biên tập và hệ thống hóa tri thức, hỗ trợ cấu trúc nội dung và làm rõ lập luận.</p>
    `,
    notes: []
  },
  {
    id: 'v1-ch1',
    title: 'CHƯƠNG 1: VÌ SAO NGHỀ PHẢI THAY ĐỔI',
    content: `
      <div style="background: #f9f9f9; padding: 40px; border-left: 5px solid #000; margin-bottom: 50px;">
        <h4 style="margin-top: 0; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.15em; font-family: Inter, sans-serif;">Mở chương</h4>
        <p style="font-size: 1.4rem; font-weight: 700; font-family: Inter, sans-serif;">Khi thiết kế không còn đủ để tồn tại</p>
        <p>AI làm cho năng lực sản xuất bản vẽ trở nên phổ cập. BIM biến dữ liệu thiết kế thành một phần của chuỗi giá trị dài hơn. Thiết kế không còn là "tác phẩm", mà là công cụ quản trị rủi ro.</p>
      </div>
      <h3>1.1. Từ hành nghề cá nhân đến điều hành doanh nghiệp</h3>
      <p>Kiến trúc sư được đào tạo để giải quyết bài toán không gian. Nhưng ngay khoảnh khắc bạn mở văn phòng, bạn chịu trách nhiệm cho cả một tổ chức: lương, dòng tiền, pháp lý. Quản trị không làm mất sáng tạo, quản trị kém mới giết chết sáng tạo.</p>
      <h3>1.2. Khủng hoảng hệ thống của ngành AEC</h3>
      <p>Rào cản gia nhập nghề giảm mạnh, chủ đầu tư ngày càng am hiểu và kiểm soát chặt chẽ hơn. Chi phí vận hành tăng nhanh hơn doanh thu.</p>
      <h3>1.3. Vì sao kiến trúc sư thường xem nhẹ quản trị?</h3>
      <p>Do không được giảng dạy bài bản, và do tâm lý sợ "mất chất". Sự thật là quản trị đúng giúp bảo vệ sáng tạo trước áp lực ngắn hạn.</p>
      <h3>1.4. Kiến trúc sư quản trị là ai?</h3>
      <p>Đó là một vai trò tư duy, đứng ở giao điểm giữa sáng tạo và kỷ luật. Người quản trị chịu trách nhiệm cho sự tồn tại của tổ chức.</p>
      <p><strong>Kết chương: Quản trị không phải là lựa chọn.</strong> Nếu bạn chọn làm ngơ, thị trường sẽ quản trị thay bạn.</p>
    `,
    notes: []
  },
  {
    id: 'v1-ch2',
    title: 'CHƯƠNG 2: DOANH NGHIỆP KIẾN TRÚC LÀ GÌ?',
    content: `
      <h2>CHƯƠNG 2: DOANH NGHIỆP KIẾN TRÚC LÀ GÌ?</h2>
      <p>Văn phòng kiến trúc không chỉ là nơi làm nghề, nó là một doanh nghiệp. Khách hàng không mua bản vẽ, họ mua khả năng giảm rủi ro.</p>
      <h3>2.1. Văn phòng kiến trúc không bán bản vẽ</h3>
      <p>Chúng ta tạo giá trị ở 3 tầng: Năng lực chuyên môn, Năng lực quản lý, và Năng lực tổ chức.</p>
      <h3>2.3. Ba trạng thái tồn tại của văn phòng Việt Nam</h3>
      <p>1. Sống sót bằng nghề. 2. Tăng trưởng không kiểm soát. 3. Vận hành bằng hệ thống.</p>
      <p>Làm đúng ở cấp độ dự án là chưa đủ để tồn tại ở cấp độ tổ chức.</p>
    `,
    notes: []
  },
  {
    id: 'v1-ch3',
    title: 'CHƯƠNG 3: QUẢN TRỊ CHIẾN LƯỢC',
    content: `
      <h2>CHƯƠNG 3: QUẢN TRỊ CHIẾN LƯỢC – ĐỊNH VỊ TRONG ĐẠI DƯƠNG XANH</h2>
      <p>Chiến lược không phải là làm việc hiệu quả hơn, mà là làm việc khác đi. Chiến lược là nghệ thuật của sự lựa chọn và đánh đổi.</p>
      <h3>3.3. Định vị không phải là marketing</h3>
      <p>Định vị là quyết định phục vụ ai và giải quyết vấn đề gì tốt nhất. Định vị cao không làm mất khách phù hợp, nó lọc khách.</p>
    `,
    notes: []
  },
  {
    id: 'v1-ch4',
    title: 'CHƯƠNG 4: TÀI CHÍNH QUẢN TRỊ',
    content: `
      <h2>CHƯƠNG 4: TÀI CHÍNH QUẢN TRỊ – NGÔN NGỮ CỦA SỰ SINH TỒN</h2>
      <p>Doanh thu không phải là lợi nhuận. Rất nhiều văn phòng bận rộn vẫn có thể chết lặng vì dòng tiền âm.</p>
      <h3>4.3. Năm chỉ số cốt lõi</h3>
      <p>Tỷ lệ sử dụng lao động, hệ số nhân lương ròng, tỷ lệ chi phí chung, điểm hòa vốn, và tuổi nợ.</p>
      <p>Lợi nhuận là một quyết định, không phải may mắn.</p>
    `,
    notes: []
  },
  {
    id: 'v1-ch5',
    title: 'CHƯƠNG 5: VẬN HÀNH & PHÂN QUYỀN',
    content: `
      <h2>CHƯƠNG 5: VẬN HÀNH & PHÂN QUYỀN – BIẾN Ý TƯỞNG THÀNH HỆ THỐNG</h2>
      <p>Làm thế nào để tổ chức không bị giam cầm trong sự phụ thuộc cá nhân người sáng lập? Phân quyền không phải là giao việc, mà là giao quyền quyết định.</p>
      <h3>5.4. Vai trò mới của người sáng lập</h3>
      <p>Từ người giải quyết vấn đề sang người thiết kế hệ thống giải quyết vấn đề.</p>
    `,
    notes: []
  },
  {
    id: 'v1-ch6',
    title: 'CHƯƠNG 6: CON NGƯỜI & VĂN HÓA',
    content: `
      <h2>CHƯƠNG 6: CON NGƯỜI & VĂN HÓA – KIẾN TRÚC CỦA TỔ CHỨC</h2>
      <p>Nhân sự không phải là chi phí, họ là năng lực tích lũy. Tại sao người giỏi rời đi dù không phải vì tiền?</p>
      <h3>6.3. Minh bạch và Niềm tin</h3>
      <p>Văn hóa là thứ còn lại khi người lãnh đạo không có mặt. Giữ người là giữ tương lai.</p>
    `,
    notes: []
  },
  {
    id: 'v1-ending',
    title: 'LỜI KẾT TẬP 1',
    content: `
      <h2>LỜI KẾT TẬP 1: TỪ LÀM NGHỀ ĐẾN XÂY DỰNG MỘT TỔ CHỨC</h2>
      <p>Chiến lược là quyền được lựa chọn. Vận hành là biến ý tưởng thành kết quả lặp lại. Con người là giới hạn thật sự. Chúc mừng bạn đã hoàn thành bước đầu tiên trong hành trình Kiến trúc sư Quản trị.</p>
    `,
    notes: []
  }
];

// --- CONTENT VOL 2 (Full) ---
const VOL2_SECTIONS: BookSection[] = [
  {
    id: 'v2-sec-title',
    title: 'TRANG TÊN SÁCH (T2)',
    content: `<div style="text-align: center; margin-top: 150px;"><h1 style="font-size: 1.8rem; font-weight: 300; letter-spacing: 0.2em; color: #666;">TẬP 2</h1><h1 style="font-size: 3.5rem; letter-spacing: -0.05em; font-weight: 800; margin: 1rem 0;">QUẢN LÝ CẤP TRUNG & DỰ ÁN</h1><h2 style="font-size: 1.5rem; font-weight: 300; color: #065f46; letter-spacing: 0.1em; margin-bottom: 3rem;">Từ bản vẽ đến lợi nhuận</h2><p style="font-size: 1.2rem; font-weight: 600;">Tác giả: Hoàng Trịnh Đăng & AI</p></div>`,
    notes: []
  },
  {
    id: 'v2-ch1',
    title: 'CHƯƠNG 1: QUẢN LÝ CẤP TRUNG',
    content: `<h3>Trục sống của văn phòng</h3><p>Quản lý cấp trung là tầng dễ bị hiểu sai nhất nhưng lại mang tính quyết định nhất. Chết khi dự án đến dồn dập nhưng tầng giữa không gánh nổi.</p>`,
    notes: []
  },
  {
    id: 'v2-ch2',
    title: 'CHƯƠNG 2: QUẢN LÝ DỰ ÁN KIẾN TRÚC',
    content: `<h3>Tam giác Quản trị</h3><p>Scope - Fee - Risk. Quản lý dự án là năng lực giữ cho tổ chức không bị dự án khó phá hủy.</p>`,
    notes: []
  },
  {
    id: 'v2-ch3',
    title: 'CHƯƠNG 3: PHẠM VI & THAY ĐỔI',
    content: `<h3>Nơi lợi nhuận bị bào mòn</h3><p>Scope creep không phải lỗi cá nhân, nó là lỗi hệ thống. Thay đổi là tất yếu nhưng vô tổ chức là lựa chọn.</p>`,
    notes: []
  },
  {
    id: 'v2-ch4',
    title: 'CHƯƠNG 4: QUẢN LÝ CHỦ ĐẦU TƯ',
    content: `<h3>Kỳ vọng không được quản trị</h3><p>Chủ đầu tư không mua thiết kế, họ mua sự an tâm. Quản lý chủ đầu tư là quản lý chính mình.</p>`,
    notes: []
  },
  {
    id: 'v2-ch5',
    title: 'CHƯƠNG 5: QUẢN LÝ ĐA BỘ MÔN',
    content: `<h3>Tích hợp Kỹ thuật</h3><p>Xung đột giữa Kiến trúc - Kết cấu - MEP là bài toán tổ chức. BIM không thay thế quản trị.</p>`,
    notes: []
  },
  {
    id: 'v2-ch6',
    title: 'CHƯƠNG 6: CHẤT LƯỢNG & RỦI RO',
    content: `<h3>Danh dự nghề nghiệp</h3><p>Chất lượng là khả năng lặp lại kết quả tốt. Rủi ro thiết kế có độ trễ nhiều năm.</p>`,
    notes: []
  }
];

// --- CONTENT VOL 3 (Full Detailed) ---
const VOL3_SECTIONS: BookSection[] = [
  {
    id: 'v3-sec-title',
    title: 'TRANG TÊN SÁCH (T3)',
    content: `
      <div style="text-align: center; margin-top: 150px;">
        <h1 style="font-size: 1.8rem; font-weight: 300; letter-spacing: 0.2em; color: #666;">TẬP 3</h1>
        <h1 style="font-size: 3.5rem; letter-spacing: -0.05em; font-weight: 800; margin: 1rem 0;">TÀI CHÍNH NÂNG CAO & MỞ RỘNG FIRM</h1>
        <h2 style="font-size: 1.5rem; font-weight: 300; color: #7c2d12; letter-spacing: 0.1em; margin-bottom: 3rem;">Từ sống sót đến làm chủ cuộc chơi</h2>
        <div style="width: 40px; height: 1px; background: #7c2d12; margin: 0 auto 3rem;"></div>
        <p style="font-size: 1.2rem; font-weight: 600;">Tác giả: Hoàng Trịnh Đăng & AI</p>
      </div>
    `,
    notes: []
  },
  {
    id: 'v3-ch1',
    title: 'CHƯƠNG 1: DÒNG TIỀN - QUYỀN LỰC THẬT SỰ',
    content: `<h3>Quyền lực sinh tồn</h3><p>Văn phòng kiến trúc không chết vì lỗ, mà chết vì hết tiền. Dòng tiền khỏe giúp bạn giữ phẩm giá nghề nghiệp.</p>`,
    notes: []
  },
  {
    id: 'v3-ch2',
    title: 'CHƯƠNG 2: ĐỊNH GIÁ PHÍ THIẾT KẾ',
    content: `<h3>Ngôn ngữ của Rủi ro</h3><p>Chủ đầu tư mua sự an tâm. Định giá thấp là một quyết định đạo đức làm hại đội ngũ.</p>`,
    notes: []
  },
  {
    id: 'v3-ch3',
    title: 'CHƯƠNG 3: CỔ PHẦN & QUYỀN LỰC',
    content: `<h3>Những điểm gãy chết người</h3><p>Chia cổ phần cảm tính vì "vượt khó" thường dẫn đến tan rã ở năm thứ 3. Quyền lực phải gắn với trách nhiệm.</p>`,
    notes: []
  },
  {
    id: 'v3-ch4',
    title: 'CHƯƠNG 4: PARTNER & GOVERNANCE',
    content: `<h3>Thể chế hóa Niềm tin</h3><p>Governance là nền tảng duy nhất giúp firm trưởng thành mà không tan rã. Phân tầng partner: Equity, Non-equity.</p>`,
    notes: []
  },
  {
    id: 'v3-ch5',
    title: 'CHƯƠNG 5: M&A VÀ MỞ RỘNG',
    content: `<h3>Mua năng lực hay mua Rủi ro?</h3><p>M&A trong AEC thực chất là mua năng lực vô hình. Liên danh là công cụ linh hoạt nếu quản trị tốt.</p>`,
    notes: []
  },
  {
    id: 'v3-ch6',
    title: 'CHƯƠNG 6: TỪ FIRM ĐẾN ENTERPRISE',
    content: `<h3>Bài toán Kế thừa</h3><p>Tách 3 vai trò: Architect - Leader - Owner. Xây dựng tổ chức không phụ thuộc vào một cá nhân trung tâm.</p>`,
    notes: []
  },
  {
    id: 'v3-ending',
    title: 'LỜI KẾT TẬP 3',
    content: `<h3>Làm nghề lâu hơn</h3><p>Quản trị giúp sáng tạo của bạn không bị lãng phí trong hỗn loạn. Bạn đang xây dựng một di sản.</p>`,
    notes: []
  }
];

// --- SEED BOOKS ---
const SEED_BOOKS_LIST: Book[] = [
  {
    id: 'vol-1-master',
    title: 'KIẾN TRÚC SƯ QUẢN TRỊ - TẬP 1',
    author: 'Hoàng Trịnh Đăng & AI',
    description: 'Chiến lược và vận hành cốt lõi cho văn phòng kiến trúc hiện đại.',
    coverColor: 'bg-stone-800',
    status: 'Published',
    sections: VOL1_SECTIONS,
    activeSectionId: 'v1-sec-title',
    createdAt: Date.now(),
    lastModified: Date.now(),
    settings: { pageSize: 'A4', marginTop: 25, marginBottom: 25, marginLeft: 30, marginRight: 20, fontSize: 18, lineHeight: 1.8, fontFamily: "'EB Garamond', serif" },
    notes: []
  },
  {
    id: 'vol-2-master',
    title: 'KIẾN TRÚC SƯ QUẢN TRỊ - TẬP 2',
    author: 'Hoàng Trịnh Đăng & AI',
    description: 'Quản lý cấp trung & dự án: Từ bản vẽ đến lợi nhuận.',
    coverColor: 'bg-emerald-700',
    status: 'Published',
    sections: VOL2_SECTIONS,
    activeSectionId: 'v2-sec-title',
    createdAt: Date.now(),
    lastModified: Date.now(),
    settings: { pageSize: 'A4', marginTop: 25, marginBottom: 25, marginLeft: 30, marginRight: 20, fontSize: 18, lineHeight: 1.8, fontFamily: "'EB Garamond', serif" },
    notes: []
  },
  {
    id: 'vol-3-master',
    title: 'KIẾN TRÚC SƯ QUẢN TRỊ - TẬP 3',
    author: 'Hoàng Trịnh Đăng & AI',
    description: 'Tài chính nâng cao & Mở rộng Firm: Từ sống sót đến làm chủ cuộc chơi.',
    coverColor: 'bg-orange-800',
    status: 'Draft',
    sections: VOL3_SECTIONS,
    activeSectionId: 'v3-sec-title',
    createdAt: Date.now(),
    lastModified: Date.now(),
    settings: { pageSize: 'A4', marginTop: 25, marginBottom: 25, marginLeft: 30, marginRight: 20, fontSize: 18, lineHeight: 1.8, fontFamily: "'EB Garamond', serif" },
    notes: []
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [noteInput, setNoteInput] = useState('');
  const [pageCount, setPageCount] = useState(1);
  const paperRef = useRef<HTMLDivElement>(null);

  const [activeFont, setActiveFont] = useState("'EB Garamond', serif");
  const [activeSize, setActiveSize] = useState("18px");

  useEffect(() => {
    const init = async () => {
      let loaded = await getAllBooksFromDB();
      if (loaded.length === 0) {
        for (const b of SEED_BOOKS_LIST) {
          await saveBookToDB(b);
        }
        loaded = await getAllBooksFromDB();
      }
      setBooks(loaded);
    };
    init();
  }, []);

  const currentBook = useMemo(() => books.find(b => b.id === currentBookId) || null, [books, currentBookId]);
  const currentSection = useMemo(() => currentBook?.sections.find(s => s.id === activeSectionId) || currentBook?.sections[0] || null, [currentBook, activeSectionId]);

  const updateBook = useCallback(async (id: string, updates: Partial<Book>) => {
    setBooks(prev => {
      const target = prev.find(b => b.id === id);
      if (!target) return prev;
      const updatedBook = { ...target, ...updates, lastModified: Date.now() };
      saveBookToDB(updatedBook).catch(console.error);
      return prev.map(b => b.id === id ? updatedBook : b);
    });
  }, []);

  const calculatePages = useCallback(() => {
    if (paperRef.current) {
      const totalHeight = paperRef.current.scrollHeight;
      const a4HeightPx = 297 * 3.78;
      const pages = Math.ceil(totalHeight / a4HeightPx);
      setPageCount(pages > 0 ? pages : 1);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      FontFamily,
      FontSize as any,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Tiếp tục bản thảo...' }),
    ],
    content: currentSection?.content || '',
    onUpdate: ({ editor }) => {
      if (currentBookId && currentSection) {
        setIsAutoSaving(true);
        const html = editor.getHTML();
        const updatedSections = currentBook?.sections.map(s => 
          s.id === currentSection.id ? { ...s, content: html } : s
        ) || [];
        updateBook(currentBookId, { sections: updatedSections });
        setTimeout(() => {
          setIsAutoSaving(false);
          calculatePages();
        }, 500);
      }
    },
  }, [activeSectionId, currentBookId]);

  useEffect(() => {
    if (editor && currentSection && editor.getHTML() !== currentSection.content) {
      editor.commands.setContent(currentSection.content);
      setTimeout(calculatePages, 200);
    }
  }, [activeSectionId, editor, currentSection, calculatePages]);

  const createNewBook = async () => {
    const id = `book-${Date.now()}`;
    const newBook: Book = {
      id,
      title: 'BẢN THẢO MỚI',
      author: 'Tác giả',
      description: '',
      coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
      status: 'Draft',
      sections: [{ id: 's1', title: 'CHƯƠNG MỚI', content: '', notes: [] }],
      activeSectionId: 's1',
      createdAt: Date.now(),
      lastModified: Date.now(),
      settings: { pageSize: 'A4', marginTop: 25, marginBottom: 25, marginLeft: 30, marginRight: 20, fontSize: 18, lineHeight: 1.8, fontFamily: 'EB Garamond' },
      notes: []
    };
    await saveBookToDB(newBook);
    setBooks(prev => [newBook, ...prev]);
    setCurrentBookId(id);
    setActiveSectionId('s1');
    setView('editor');
  };

  const deleteBook = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Xóa vĩnh viễn bản thảo này?')) {
      await deleteBookFromDB(id);
      setBooks(prev => prev.filter(b => b.id !== id));
    }
  };

  const addSection = () => {
    if (!currentBook) return;
    const newId = `sec-${Date.now()}`;
    const newSection: BookSection = { id: newId, title: 'CHƯƠNG MỚI', content: '', notes: [] };
    updateBook(currentBook.id, { sections: [...currentBook.sections, newSection] });
    setActiveSectionId(newId);
  };

  const deleteSection = (e: React.MouseEvent, sectionId: string) => {
    e.stopPropagation();
    if (!currentBook || currentBook.sections.length <= 1) return;
    if (confirm('Xóa chương này?')) {
      const updatedSections = currentBook.sections.filter(s => s.id !== sectionId);
      updateBook(currentBook.id, { sections: updatedSections });
      if (activeSectionId === sectionId) setActiveSectionId(updatedSections[0].id);
    }
  };

  const addNote = () => {
    if (!noteInput.trim() || !currentBook || !currentSection) return;
    const newNote = { id: Date.now().toString(), text: noteInput, author: 'Editor', createdAt: Date.now(), color: '#fef08a' };
    const updatedSections = currentBook.sections.map(s => 
      s.id === currentSection.id ? { ...s, notes: [...s.notes, newNote] } : s
    );
    updateBook(currentBook.id, { sections: updatedSections });
    setNoteInput('');
  };

  if (view === 'home') return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center font-sans arch-grid">
      <div className="text-center space-y-6 mb-24 relative z-10">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-[clamp(4rem,12vw,10rem)] font-black tracking-tighter text-black">ARCHIBOOK</motion.h1>
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[clamp(1rem,2vw,2rem)] font-light tracking-[1.5em] uppercase text-stone-400">STUDIO</motion.h2>
      </div>
      <div className="flex flex-col gap-4 w-72 z-10">
        <button onClick={() => setView('library')} className="w-full px-8 py-6 bg-black text-white text-[11px] uppercase tracking-[0.5em] font-black hover:bg-stone-800 transition-all">Thư viện bản thảo</button>
        <button onClick={createNewBook} className="w-full px-8 py-6 border-2 border-black text-[11px] uppercase tracking-[0.5em] font-black hover:bg-black hover:text-white transition-all">Tạo bản mới</button>
      </div>
    </div>
  );

  if (view === 'library') return (
    <div className="min-h-screen bg-white p-12 md:p-24 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-20">
        <div className="flex justify-between items-end border-b pb-16">
          <div className="space-y-4">
            <button onClick={() => setView('home')} className="text-[10px] uppercase font-black text-stone-300 flex items-center gap-2"><Icons.Prev className="w-3" /> Quay lại</button>
            <h2 className="text-7xl font-light tracking-tighter">Kệ sách <span className="italic font-serif-book text-stone-300">đang viết</span></h2>
          </div>
          <button onClick={createNewBook} className="bg-black text-white px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-transform">+ Bản thảo mới</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {books.map(b => (
            <motion.div key={b.id} whileHover={{ y: -10 }} className="group cursor-pointer" onClick={() => { setCurrentBookId(b.id); setView('editor'); setActiveSectionId(b.sections[0].id); }}>
              <div className={`aspect-[3/4.2] ${b.coverColor} p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all group-hover:shadow-stone-200`}>
                <div className="h-0.5 w-12 bg-white/40" />
                <h3 className="text-2xl font-serif-book text-white uppercase font-bold leading-tight">{b.title}</h3>
                <div className="space-y-1">
                   <p className="text-[9px] text-white/60 font-black uppercase tracking-widest">{b.author}</p>
                   <div className="h-px w-full bg-white/10" />
                </div>
                <button onClick={(e) => deleteBook(e, b.id)} className="absolute top-4 right-4 p-2 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-500"><Icons.Delete className="text-white w-4" /></button>
              </div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-stone-400">{b.sections.length} Chương • {new Date(b.lastModified).toLocaleDateString()}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F3] overflow-hidden">
      <header className="h-16 bg-white border-b flex items-center justify-between px-8 no-print shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('library')} className="p-2 hover:bg-stone-50 rounded-full"><Icons.Prev /></button>
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-stone-400">{currentBook?.title}</span>
            <div className="text-[8px] font-bold text-stone-300 uppercase">{isAutoSaving ? 'Đồng bộ DB...' : 'Lưu an toàn'}</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">Dự kiến dàn trang</span>
            <span className="text-[11px] font-bold text-black uppercase">{pageCount} TRANG A4</span>
          </div>
          <button onClick={() => setShowNotes(!showNotes)} className={`px-6 py-2 rounded-full border text-[9px] font-black uppercase tracking-wider transition-colors ${showNotes ? 'bg-black text-white' : 'bg-white hover:bg-stone-50'}`}>{showNotes ? 'Ẩn biên tập' : 'Hiện biên tập'}</button>
          <button onClick={() => window.print()} className="bg-black text-white px-8 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-colors">Xuất PDF</button>
        </div>
      </header>

      <div className="bg-white border-b p-3 px-8 flex items-center gap-4 no-print shadow-sm shrink-0">
        <button onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-2 rounded transition-colors ${editor?.isActive('bold') ? 'bg-stone-100' : 'hover:bg-stone-50'}`}><Icons.Editor className="w-4" /></button>
        <button onClick={() => editor?.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} className="p-2 bg-yellow-100 rounded hover:bg-yellow-200 transition-colors"><Icons.Highlight className="w-4 text-yellow-600" /></button>
        <div className="h-4 w-px bg-stone-200 mx-2" />
        <select className="bg-stone-50 px-4 py-2 rounded text-[10px] uppercase font-bold outline-none" value={activeFont} onChange={(e) => { setActiveFont(e.target.value); editor?.chain().focus().setFontFamily(e.target.value).run(); }}>
          {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
        </select>
        <select className="bg-stone-50 px-4 py-2 rounded text-[10px] uppercase font-bold outline-none" value={activeSize} onChange={(e) => { setActiveSize(e.target.value); (editor as any).chain().focus().setFontSize(e.target.value).run(); }}>
          {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 bg-white border-r p-6 space-y-6 overflow-y-auto no-print custom-scroll shrink-0">
          <div className="flex justify-between items-center"><h5 className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Mục lục</h5><button onClick={addSection} className="hover:scale-110 transition-transform"><Icons.Plus className="w-4" /></button></div>
          <div className="space-y-2">
            {currentBook?.sections.map(s => (
              <div key={s.id} className="relative group">
                <button onClick={() => setActiveSectionId(s.id)} className={`w-full text-left p-4 rounded-xl text-[9px] font-bold uppercase transition-all ${activeSectionId === s.id ? 'bg-black text-white shadow-lg translate-x-1' : 'hover:bg-stone-50'}`}>{s.title}</button>
                <button onClick={(e) => deleteSection(e, s.id)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"><Icons.Delete className="w-3 text-red-300" /></button>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-12 bg-[#F5F5F3] custom-scroll">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-scroll-container" ref={paperRef}>
            <input value={currentSection?.title || ''} onChange={(e) => {
              if (currentBookId && currentSection) {
                 const updatedSections = currentBook.sections.map(s => s.id === currentSection.id ? {...s, title: e.target.value} : s);
                 updateBook(currentBookId, { sections: updatedSections });
              }
            }} className="w-full text-center text-4xl font-serif-book font-bold mb-12 border-none outline-none bg-transparent uppercase tracking-tight" placeholder="Tiêu đề..." />
            <div className="tiptap-body" style={{ fontFamily: activeFont, fontSize: activeSize }}>
              <EditorContent editor={editor} />
            </div>
          </motion.div>
        </main>

        <AnimatePresence>
          {showNotes && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 350, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="bg-white border-l p-8 overflow-y-auto no-print custom-scroll shrink-0">
              <h5 className="text-[9px] font-black uppercase text-stone-300 tracking-widest mb-6">Biên tập</h5>
              <div className="space-y-4">
                <textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Ghi chú đoạn cần sửa..." className="w-full bg-stone-50 p-4 rounded-xl text-[11px] h-32 resize-none border-none outline-none" />
                <button onClick={addNote} className="w-full py-3 bg-black text-white text-[10px] font-black uppercase rounded-xl">Lưu ghi chú</button>
                <div className="space-y-3 mt-8">
                  {currentSection?.notes.map(n => (
                    <motion.div key={n.id} className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 relative group shadow-sm">
                      <p className="text-[11px] leading-relaxed text-stone-700 italic">"{n.text}"</p>
                      <button onClick={() => {
                         const updatedSections = currentBook!.sections.map(s => s.id === currentSection!.id ? {...s, notes: s.notes.filter(note => note.id !== n.id)} : s);
                         updateBook(currentBookId!, { sections: updatedSections });
                      }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-300"><Icons.Delete className="w-3" /></button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
