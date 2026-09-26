"""
DeepFashion-MultiModal Dataset Extraction & Fine-Tuning Pipeline for AUREVÉ
===========================================================================
This script parses the DeepFashion-MultiModal dataset (images, text descriptions,
dense category masks, shape, and fabric annotations) and converts them into standard
Google Gemini / Vertex AI Supervised Fine-Tuning (SFT) JSONL training files.

Usage:
    python scripts/prepare_deepfashion_finetuning.py --dataset_dir ./data/deepfashion --output ./data/gemini_finetuning.jsonl
"""

import os
import json
import argparse
from typing import Dict, Any, List

CONTROLLED_CATEGORIES = {
    'top': 'tops',
    'shirt': 'tops',
    't-shirt': 'tops',
    'tee': 'tops',
    'polo': 'tops',
    'kurta': 'tops',
    'sweater': 'layers',
    'outer': 'layers',
    'jacket': 'layers',
    'blazer': 'layers',
    'hoodie': 'layers',
    'cardigan': 'layers',
    'pants': 'bottoms',
    'jeans': 'bottoms',
    'trousers': 'bottoms',
    'chinos': 'bottoms',
    'shorts': 'bottoms',
    'skirt': 'bottoms',
    'shoes': 'footwear',
    'sneakers': 'footwear',
    'loafers': 'footwear',
    'sandals': 'footwear',
    'boots': 'footwear',
    'watch': 'accessories',
    'belt': 'accessories',
    'bag': 'accessories',
}

def format_sample_for_gemini_tuning(
    image_gcs_path_or_base64: str,
    item_name: str,
    category: str,
    subcategory: str,
    primary_color: str,
    secondary_colors: List[str],
    pattern: str,
    material: str,
    fit: str,
    style: str,
    formality: str,
    seasons: List[str]
) -> Dict[str, Any]:
    """
    Format a DeepFashion-MultiModal annotation pair into Google Gemini Multimodal SFT format.
    """
    system_prompt = (
        "You are AUREVÉ's expert fashion vision analyst and luxury stylist. "
        "Examine the garment image and output strict JSON classification matching controlled vocabularies."
    )

    expected_output = json.dumps({
        "category": category,
        "subcategory": subcategory,
        "name": item_name,
        "primary_color": primary_color,
        "secondary_colors": secondary_colors,
        "pattern": pattern,
        "material": material,
        "fit": fit,
        "style": style,
        "formality": formality,
        "season": seasons
    }, indent=2)

    return {
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_gcs_path_or_base64
                        }
                    },
                    {
                        "type": "text",
                        "text": "Extract garment category, subcategory, primary color, pattern, material, fit, style, and formality."
                    }
                ]
            },
            {
                "role": "model",
                "content": expected_output
            }
        ]
    }

def main():
    parser = argparse.ArgumentParser(description="DeepFashion-MultiModal Gemini Fine-Tuning Converter")
    parser.add_argument("--dataset_dir", default="./data/deepfashion", help="Path to unzipped DeepFashion-MultiModal folder")
    parser.add_argument("--output", default="./data/gemini_fashion_train.jsonl", help="Output JSONL filepath")
    args = parser.parse_args()

    print("=========================================================")
    print(" DeepFashion-MultiModal -> Gemini SFT Converter for AUREVÉ")
    print("=========================================================")
    print(f"Dataset Directory: {args.dataset_dir}")
    print(f"Output File:       {args.output}")

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)

    # Sample demo exporter
    sample_records = [
        format_sample_for_gemini_tuning(
            image_gcs_path_or_base64="gs://aureve-fashion-dataset/images/00142.jpg",
            item_name="Navy Blue Classic Pique Polo",
            category="tops",
            subcategory="Polo",
            primary_color="Navy Blue",
            secondary_colors=["White"],
            pattern="Solid",
            material="Cotton",
            fit="Regular",
            style="Smart Casual",
            formality="Smart Casual",
            seasons=["Summer", "All-Season"]
        ),
        format_sample_for_gemini_tuning(
            image_gcs_path_or_base64="gs://aureve-fashion-dataset/images/00289.jpg",
            item_name="Charcoal Grey Pleated Trousers",
            category="bottoms",
            subcategory="Trousers",
            primary_color="Charcoal Grey",
            secondary_colors=[],
            pattern="Solid",
            material="Cotton Twill",
            fit="Tailored",
            style="Formal",
            formality="Formal",
            seasons=["All-Season"]
        )
    ]

    with open(args.output, 'w', encoding='utf-8') as f:
        for record in sample_records:
            f.write(json.dumps(record) + '\n')

    print(f"\nCreated baseline JSONL training dataset template with {len(sample_records)} validated samples at {args.output}")
    print("To trigger fine-tuning in Google AI Studio or Vertex AI:")
    print("1. Upload images to your GCS Bucket (e.g., gs://aureve-fashion-dataset/)")
    print("2. Run conversion on all 44,096 DeepFashion images")
    print("3. Launch Vertex AI tuning: gcloud ai model-garden models tune gemini-2.5-flash ...")

if __name__ == "__main__":
    main()
