export interface AnalysisChartData {
    label: string;
    [key: string]: string | number; // Allow flexible keys for multi-line/mixed data
}

export interface AnalysisChartConfig {
    type: string;
    title: string;
    xAxisLabel: string;
    yAxisLabel: string;
    yAxisLabel2?: string;
    tooltipCol?: string;
    data: AnalysisChartData[];
    series?: {
        name: string;
        key: string;
        type?: 'line' | 'bar';
        color: string;
        yAxisID?: string;
    }[];
}

export interface AnalysisSection {
    title: string;
    category: string;
    description: string;
    charts: AnalysisChartConfig[];
}

export const analysisData: Record<string, AnalysisSection> = {
    ekonomi: {
        title: "Analisis Pergeseran Struktur Ekonomi (Shift-Share)",
        category: "Ekonomi",
        description: `
Analisis Shift-Share digunakan untuk mengetahui perubahan dan pergeseran sektor atau industri pada perekonomian regional (Kabupaten Majene) dibandingkan dengan perekonomian yang lebih tinggi (Provinsi Sulawesi Barat).

Analisis ini membagi pertumbuhan ekonomi menjadi tiga komponen:
1. Pertumbuhan Nasional (National Share): Pengaruh pertumbuhan ekonomi provinsi terhadap sektor di kabupaten.
2. Bauran Industri (Proportional Shift): Pertumbuhan sektor tertentu dibandingkan dengan total pertumbuhan ekonomi provinsi.
3. Keunggulan Kompetitif (Differential Shift): Daya saing sektor tertentu di kabupaten dibandingkan dengan sektor yang sama di tingkat provinsi.

Berdasarkan perhitungan Shift-Share, sektor-sektor di Kabupaten Majene dapat dikelompokkan ke dalam 4 kuadran berdasarkan nilai Proportional Shift (Pertumbuhan) dan Differential Shift (Daya Saing).

 Kuadran I (Sektor Unggulan): Pertanian, Kehutanan, dan Perikanan; Industri Pengolahan; Transportasi dan Pergudangan; Jasa Kesehatan. Sektor ini memiliki pertumbuhan cepat dan daya saing tinggi.
 Kuadran II (Sektor Potensial): Jasa Pendidikan; Konstruksi; Jasa Keuangan. Memiliki daya saing kuat namun pertumbuhan regional melambat.
 Kuadran III (Sektor Tertinggal): Administrasi Pemerintahan; Pengadaan Air. Daya saing lemah dan pertumbuhan lambat.
 Kuadran IV (Sektor Berkembang): Informasi dan Komunikasi; Perdagangan Besar; Pertambangan; Real Estate. Daya saing lemah namun tumbuh cepat secara regional.
        `,
        charts: [
            {
                type: "scatter",
                title: "Matriks Shift-Share Sektor Ekonomi",
                xAxisLabel: "Pertumbuhan (Proportional Shift)",
                yAxisLabel: "Daya Saing (Differential Shift)",
                tooltipCol: "label",
                data: [
                    { label: "A. Pertanian", x: 1.81, y: 4.09 },
                    { label: "B. Pertambangan", x: 5.10, y: -6.83 },
                    { label: "C. Industri", x: 2.15, y: 15.07 },
                    { label: "D. Listrik & Gas", x: 29.17, y: -5.29 },
                    { label: "E. Air & Limbah", x: -2.68, y: -9.92 },
                    { label: "F. Konstruksi", x: -9.60, y: 3.35 },
                    { label: "G. Perdagangan", x: 3.81, y: -0.85 },
                    { label: "H. Transportasi", x: 8.02, y: 4.24 },
                    { label: "I. Akomodasi", x: 14.56, y: -0.31 },
                    { label: "J. Info & Komunikasi", x: 14.23, y: -2.37 },
                    { label: "K. Keuangan", x: -2.64, y: 2.94 },
                    { label: "L. Real Estate", x: 4.84, y: -3.45 },
                    { label: "M,N. Jasa Perusahaan", x: 1.13, y: -0.27 },
                    { label: "O. Admin Pemerintahan", x: -13.68, y: -1.81 },
                    { label: "P. Pendidikan", x: -11.22, y: 3.53 },
                    { label: "Q. Kesehatan", x: 8.03, y: 0.92 },
                    { label: "R,S,T,U. Jasa Lainnya", x: 2.26, y: 0.80 }
                ]
            }
        ]
    },
    kemiskinan: {
        title: "Analisis Kemiskinan: Indeks Foster-Greer-Thorbecke (FGT)",
        category: "Kemiskinan",
        description: `
Analisis kemiskinan di Kabupaten Majene menggunakan pendekatan Indeks Foster-Greer-Thorbecke (FGT), yang mencakup tiga indikator utama:

1. Headcount Index (P0) & Jumlah Penduduk Miskin:
Menggambarkan persentase dan jumlah absolut penduduk yang berada di bawah Garis Kemiskinan. Penurunan P0 menunjukkan keberhasilan program pengentasan kemiskinan dalam mengurangi jumlah penduduk miskin secara umum.

2. Indeks Kedalaman (P1) & Keparahan (P2) Kemiskinan:
P1 (Poverty Gap Index): Rata-rata kesenjangan pengeluaran penduduk miskin terhadap garis kemiskinan. Semakin tinggi nilai P1, semakin jauh rata-rata pengeluaran penduduk miskin dari garis kemiskinan.
P2 (Poverty Severity Index): Menggambarkan ketimpangan pengeluaran di antara penduduk miskin itu sendiri. Nilai P2 yang tinggi menunjukkan ketimpangan yang tinggi di antara penduduk miskin.

Meskipun tingkat kemiskinan (P0) menunjukkan tren penurunan, fluktuasi pada indeks P1 dan P2 mengindikasikan dinamika kesejahteraan di kalangan penduduk miskin. Strategi penanggulangan kemiskinan harus berfokus tidak hanya pada bantuan sosial tunai untuk sekadar mengangkat mereka ke atas garis kemiskinan, tetapi juga pemberdayaan ekonomi untuk memperkecil gap pendapatan dan ketimpangan.
        `,
        charts: [
            {
                type: "mixed", 
                title: "Perkembangan Jumlah dan Persentase Penduduk Miskin (P0)",
                xAxisLabel: "Tahun",
                yAxisLabel: "Jumlah (Ribu Jiwa)",
                yAxisLabel2: "Persentase (%)",
                data: [
                    { label: "2020", barValue: 23.45, lineValue: 13.73 },
                    { label: "2021", barValue: 24.68, lineValue: 14.34 },
                    { label: "2022", barValue: 26.24, lineValue: 15.13 },
                    { label: "2023", barValue: 25.35, lineValue: 14.54 },
                    { label: "2024", barValue: 23.95, lineValue: 13.64 },
                    { label: "2025", barValue: 23.10, lineValue: 12.98 }
                ],
                series: [
                    { name: "Jumlah Penduduk Miskin (Ribu)", key: "barValue", type: "bar", color: "#3b82f6" },
                    { name: "Persentase Penduduk Miskin (%)", key: "lineValue", type: "line", color: "#ef4444", yAxisID: "y1" }
                ]
            },
            {
                type: "multi-line",
                title: "Indeks Kedalaman (P1) dan Keparahan (P2) Kemiskinan",
                xAxisLabel: "Tahun",
                yAxisLabel: "Nilai Indeks",
                data: [
                    { label: "2020", p1: 2.15, p2: 0.54 },
                    { label: "2021", p1: 2.38, p2: 0.62 },
                    { label: "2022", p1: 2.65, p2: 0.71 },
                    { label: "2023", p1: 2.45, p2: 0.65 },
                    { label: "2024", p1: 2.20, p2: 0.58 },
                    { label: "2025", p1: 1.95, p2: 0.49 }
                ],
                series: [
                    { name: "Indeks Kedalaman Kemiskinan (P1)", key: "p1", color: "#10b981" },
                    { name: "Indeks Keparahan Kemiskinan (P2)", key: "p2", color: "#f59e0b" }
                ]
            }
        ]
    }
};