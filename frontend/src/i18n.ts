import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

const resources = {
  ja: {
    translation: {
      nav: {
        orgChart: "組織図",
        compare: "組織図比較",
        employees: "社員一覧",
        departments: "部署一覧",
        history: "変更履歴",
        upload: "データアップロード",
        portalTitle: "組織図ポータル",
      },
      orgChart: {
        viewHistorical: "過去の履歴を参照",
        viewCurrent: "現在を表示",
        refresh: "更新",
        download: "ダウンロード",
        loading: "組織図を読み込んでいます...",
        error: "組織図の読み込みに失敗しました",
        yearChart: "{{year}}年度組織図",
      },
      export: {
        title: "出力フォーマット選択",
        pdf: "PDFでダウンロード (.pdf)",
        pdfDesc: "高画質印刷用PDF (F4縦・複数ページ対応)",
        excel: "Excelでダウンロード (.xlsx)",
        excelDesc: "部署・社員データのExcel帳票",
        csv: "CSVでダウンロード (.csv)",
        csvDesc: "UTF-8 BOM付きCSVデータ",
        png: "PNG画像でダウンロード (.png)",
        pngDesc: "高解像度組織図画像",
        json: "JSONでダウンロード (.json)",
        jsonDesc: "ツリー構造JSONデータ",
        generating: "{{format}}を作成中...",
      },
      users: {
        title: "社員一覧",
        searchPlaceholder: "氏名、社員ID、役職、部署で検索...",
        addUser: "社員追加",
        id: "社員ID",
        name: "氏名",
        department: "所属部署",
        titleCol: "役職",
        status: "ステータス",
        version: "バージョン",
        actions: "操作",
        active: "在籍",
        inactive: "退職",
        vip: "役員",
        kenmu: "兼務",
        edit: "編集",
        deactivate: "無効化",
        total: "全社員数",
      },
      departments: {
        title: "部署管理",
        addDept: "部署追加",
        id: "部署ID",
        name: "部署名",
        parent: "親部署",
        head: "部署長",
        version: "バージョン",
        actions: "操作",
      },
      history: {
        title: "変更履歴ログ",
        filterAll: "すべての変更",
        filterUsers: "社員のみ",
        filterDepts: "部署のみ",
        table: "対象",
        action: "操作",
        recordId: "レコードID",
        details: "詳細",
        changedBy: "変更者",
        changedAt: "日時",
      },
      upload: {
        title: "マスターデータ・アップロード",
        usersExcel: "社員マスター (sys_user.xlsx)",
        deptExcel: "部署マスター (cmn_department.xlsx)",
        dropOrClick: "Excelファイルをドラッグ＆ドロップまたは選択",
        uploading: "Excelを処理中...",
        success: "データが正常に更新されました！",
      },
      common: {
        save: "保存",
        cancel: "キャンセル",
        delete: "削除",
        close: "閉じる",
        confirm: "確認",
      },
    },
  },
  en: {
    translation: {
      nav: {
        orgChart: "Organizational Chart",
        compare: "Compare Views",
        employees: "Employee List",
        departments: "Departments",
        history: "Change Log",
        upload: "Upload Data",
        portalTitle: "Organogram Portal",
      },
      orgChart: {
        viewHistorical: "View Historical Records",
        viewCurrent: "View Current",
        refresh: "Refresh",
        download: "Download",
        loading: "Loading organizational chart...",
        error: "Failed to load organizational chart",
        yearChart: "{{year}} Fiscal Year Org Chart",
      },
      export: {
        title: "Export Formats",
        pdf: "Download as PDF (.pdf)",
        pdfDesc: "Multi-page print PDF (F4 Portrait)",
        excel: "Download as Excel (.xlsx)",
        excelDesc: "Structured workbook with sheets",
        csv: "Download as CSV (.csv)",
        csvDesc: "UTF-8 BOM compatible spreadsheet",
        png: "Download as PNG Image (.png)",
        pngDesc: "High-resolution image format",
        json: "Download as JSON (.json)",
        jsonDesc: "Raw tree structure export",
        generating: "Generating {{format}}...",
      },
      users: {
        title: "Employee List",
        searchPlaceholder: "Search by name, ID, title, department...",
        addUser: "Add Employee",
        id: "User ID",
        name: "Name",
        department: "Department",
        titleCol: "Title",
        status: "Status",
        version: "Version",
        actions: "Actions",
        active: "Active",
        inactive: "Inactive",
        vip: "VIP",
        kenmu: "Kenmu (Concurrent)",
        edit: "Edit",
        deactivate: "Deactivate",
        total: "Total Employees",
      },
      departments: {
        title: "Department Management",
        addDept: "Add Department",
        id: "Department ID",
        name: "Department Name",
        parent: "Parent Department",
        head: "Department Head",
        version: "Version",
        actions: "Actions",
      },
      history: {
        title: "Change History Log",
        filterAll: "All Changes",
        filterUsers: "Employees Only",
        filterDepts: "Departments Only",
        table: "Target",
        action: "Action",
        recordId: "Record ID",
        details: "Details",
        changedBy: "Changed By",
        changedAt: "Timestamp",
      },
      upload: {
        title: "Master Data Upload",
        usersExcel: "Employee Master (sys_user.xlsx)",
        deptExcel: "Department Master (cmn_department.xlsx)",
        dropOrClick: "Drag & drop Excel file here or click to browse",
        uploading: "Processing Excel...",
        success: "Data updated successfully!",
      },
      common: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        close: "Close",
        confirm: "Confirm",
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "ja",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "syslabo_lang",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on("languageChanged", (lng) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng.startsWith("en") ? "en" : "ja";
  }
});

if (typeof document !== "undefined") {
  document.documentElement.lang =
    i18n.language && i18n.language.startsWith("en") ? "en" : "ja";
}

export default i18n;
