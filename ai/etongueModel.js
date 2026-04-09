const tf = require("@tensorflow/tfjs");
const xlsx = require("xlsx");
const path = require("path");

let model = null;

// 🔥 Label mapping
const labelsMap = ["Amla", "Lavana", "Madhura", "Nilavembu"];

// ✅ Load Excel
function loadExcel(filePath) {
    const wb = xlsx.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];

    const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

    console.log("📊 Total rows from Excel:", data.length);
    console.log("📊 Columns:", Object.keys(data[0]));

    const cleaned = data.map(row => {
        const item = {
            ph: Number(row.pH),   // 🔥 NEW
            tds: Number(row.TDS),
            voc: Number(row.VOC),
            r: Number(row.R),
            g: Number(row.G),
            b: Number(row.B),
            freq: Number(row.FREQUENCY),
            label: Number(
                row.LABELNUM ??
                row["LABELNUM "] ??
                row[" LABELNUM"] ??
                row.labelnum
            )
        };

        if (
            isNaN(item.ph) ||
            isNaN(item.tds) ||
            isNaN(item.voc) ||
            isNaN(item.r) ||
            isNaN(item.g) ||
            isNaN(item.b) ||
            isNaN(item.freq) ||
            isNaN(item.label)
        ) {
            console.log("❌ Removed row:", item);
            return null;
        }

        return item;
    }).filter(Boolean);

    console.log("✅ Clean rows:", cleaned.length);

    return cleaned;
}

// ✅ Train Model
async function trainModel() {
    console.log("📊 Loading dataset...");

    const filePath = path.join(__dirname, "../ETongueDataset.xlsx");
    const data = loadExcel(filePath);

    if (!data || data.length < 20) {
        console.log("❌ Not enough data");
        return;
    }

    console.log("✅ Rows:", data.length);

    // 🔥 Normalize (NOW 7 FEATURES)
    const inputs = data.map(d => [
        d.ph / 14,        // 🔥 pH normalization
        d.tds / 1000,
        d.voc / 1000,
        d.r / 255,
        d.g / 255,
        d.b / 255,
        d.freq / 100
    ]);

    // 🔥 One-hot encoding
    const labels = data.map(d => {
        const arr = [0, 0, 0, 0];
        arr[d.label] = 1;
        return arr;
    });

    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(labels);

    // 🔥 Improved Model
    model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, inputShape: [7], activation: "relu" }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: 16, activation: "relu" }));
    model.add(tf.layers.dense({ units: 4, activation: "softmax" }));

    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"]
    });

    console.log("⚡ Training...");

    await model.fit(xs, ys, {
        epochs: 120,
        batchSize: 16,
        shuffle: true
    });

    console.log("✅ Model trained");
}

// ✅ Predict
async function predictTaste(ph, tds, voc, r, g, b, freq) {
    try {
        if (!model) {
            console.log("⚡ Training model first...");
            await trainModel();
        }

        const input = tf.tensor2d([[
            ph / 14,
            tds / 1000,
            voc / 1000,
            r / 255,
            g / 255,
            b / 255,
            freq / 100
        ]]);

        const output = model.predict(input);
        const data = output.dataSync();

        const index = data.indexOf(Math.max(...data));

        return labelsMap[index];

    } catch (err) {
        console.log("❌ Prediction error:", err);
        return null;
    }
}

module.exports = {
    trainModel,
    predictTaste
};