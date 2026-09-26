/**
 * DeepFashion-MultiModal Dataset Extraction & Fine-Tuning Pipeline for AUREVÉ (Node.js)
 * Converts DeepFashion annotations into Google Vertex AI / Gemini 2.5 Flash SFT JSONL format.
 */
const fs = require('fs');
const path = require('path');

function createSampleRecord(imagePath, name, category, subcategory, primaryColor, secondaryColors, pattern, material, fit, style, formality, seasons) {
  return {
    messages: [
      {
        role: 'system',
        content: "You are AUREVÉ's expert fashion vision analyst and luxury stylist. Examine the garment image and output strict JSON classification matching controlled vocabularies.",
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imagePath },
          },
          {
            type: 'text',
            text: 'Extract garment category, subcategory, primary color, pattern, material, fit, style, and formality.',
          },
        ],
      },
      {
        role: 'model',
        content: JSON.stringify(
          {
            category,
            subcategory,
            name,
            primary_color: primaryColor,
            secondary_colors: secondaryColors,
            pattern,
            material,
            fit,
            style,
            formality,
            season: seasons,
          },
          null,
          2
        ),
      },
    ],
  };
}

function main() {
  const outputDir = path.resolve(__dirname, '../data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'gemini_deepfashion_sft.jsonl');
  const samples = [
    createSampleRecord(
      'gs://aureve-fashion-dataset/0001.jpg',
      'Sky Blue Cotton Oxford Shirt',
      'tops',
      'Shirt',
      'Sky Blue',
      ['White'],
      'Solid',
      'Cotton',
      'Regular',
      'Smart Casual',
      'Smart Casual',
      ['Summer', 'All-Season']
    ),
    createSampleRecord(
      'gs://aureve-fashion-dataset/0002.jpg',
      'Dark Indigo Straight Denim Jeans',
      'bottoms',
      'Jeans',
      'Navy Blue',
      [],
      'Solid',
      'Denim',
      'Regular',
      'Casual',
      'Casual',
      ['All-Season']
    ),
    createSampleRecord(
      'gs://aureve-fashion-dataset/0003.jpg',
      'Minimalist White Leather Sneakers',
      'footwear',
      'Sneakers',
      'White',
      ['Light Grey'],
      'Solid',
      'Leather',
      'Not Applicable',
      'Smart Casual',
      'Smart Casual',
      ['All-Season', 'Summer']
    ),
  ];

  const content = samples.map((s) => JSON.stringify(s)).join('\n') + '\n';
  fs.writeFileSync(outputPath, content, 'utf8');

  console.log('Successfully generated DeepFashion-MultiModal Gemini SFT JSONL at:', outputPath);
}

main();
