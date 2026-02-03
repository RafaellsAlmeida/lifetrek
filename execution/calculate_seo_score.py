#!/usr/bin/env python3
"""
SEO Score Calculator
Audits blog posts for SEO optimization and provides actionable recommendations

Usage:
    python execution/calculate_seo_score.py --url https://lifetrek-medical.com/blog/post-slug
    python execution/calculate_seo_score.py --all --output seo_audit.json
"""

import os
import sys
import json
import argparse
import re
from typing import Dict, List
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')


class SEOAuditor:
    """Calculates SEO scores and provides optimization recommendations"""
    
    def __init__(self):
        self.scores = {}
        self.issues = []
        self.recommendations = []
    
    def audit_title(self, title: str, primary_keyword: str = None) -> Dict:
        """Audit page title"""
        score = 0
        max_score = 20
        
        # Length check (50-60 chars ideal)
        length = len(title)
        if 50 <= length <= 60:
            score += 10
        elif 40 <= length < 50 or 60 < length <= 70:
            score += 7
            self.recommendations.append(f"Title length ({length} chars) is acceptable but 50-60 is ideal")
        else:
            score += 3
            self.issues.append(f"Title length ({length} chars) should be 50-60 characters")
        
        # Keyword in title
        if primary_keyword and primary_keyword.lower() in title.lower():
            score += 10
            # Check if at beginning
            if title.lower().startswith(primary_keyword.lower()[:10]):
                self.recommendations.append("✓ Primary keyword at beginning of title")
        elif primary_keyword:
            score += 0
            self.issues.append(f"Primary keyword '{primary_keyword}' not in title")
        else:
            score += 5  # No keyword specified
        
        return {'score': score, 'max': max_score, 'length': length}
    
    def audit_meta_description(self, description: str, primary_keyword: str = None) -> Dict:
        """Audit meta description"""
        score = 0
        max_score = 15
        
        if not description:
            self.issues.append("Meta description is missing")
            return {'score': 0, 'max': max_score, 'length': 0}
        
        # Length check (150-160 chars ideal)
        length = len(description)
        if 150 <= length <= 160:
            score += 8
        elif 120 <= length < 150 or 160 < length <= 180:
            score += 5
            self.recommendations.append(f"Meta description ({length} chars) is acceptable but 150-160 is ideal")
        else:
            score += 2
            self.issues.append(f"Meta description ({length} chars) should be 150-160 characters")
        
        # Keyword in description
        if primary_keyword and primary_keyword.lower() in description.lower():
            score += 7
        elif primary_keyword:
            self.issues.append(f"Primary keyword '{primary_keyword}' not in meta description")
        else:
            score += 3
        
        return {'score': score, 'max': max_score, 'length': length}
    
    def audit_headers(self, html_content: str) -> Dict:
        """Audit header structure (H1-H6)"""
        score = 0
        max_score = 15
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # H1 check (exactly 1)
        h1_tags = soup.find_all('h1')
        if len(h1_tags) == 1:
            score += 5
        elif len(h1_tags) == 0:
            score += 0
            self.issues.append("No H1 tag found - must have exactly one")
        else:
            score += 2
            self.issues.append(f"Multiple H1 tags found ({len(h1_tags)}) - should have exactly one")
        
        # H2 check (3-6 recommended)
        h2_tags = soup.find_all('h2')
        h2_count = len(h2_tags)
        if 3 <= h2_count <= 6:
            score += 5
        elif 2 <= h2_count < 3 or 6 < h2_count <= 8:
            score += 3
            self.recommendations.append(f"H2 count ({h2_count}) is acceptable but 3-6 is ideal for SEO")
        else:
            score += 1
            self.issues.append(f"H2 count ({h2_count}) should be 3-6 for optimal structure")
        
        # Hierarchy check
        all_headers = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        hierarchy_valid = True
        prev_level = 0
        for header in all_headers:
            level = int(header.name[1])
            if level - prev_level > 1:
                hierarchy_valid = False
                self.issues.append(f"Header hierarchy skip detected: {header.name.upper()} after H{prev_level}")
                break
            prev_level = level
        
        if hierarchy_valid:
            score += 5
        
        return {
            'score': score,
            'max': max_score,
            'h1_count': len(h1_tags),
            'h2_count': h2_count,
            'h3_count': len(soup.find_all('h3'))
        }
    
    def audit_keyword_density(self, text_content: str, primary_keyword: str) -> Dict:
        """Audit keyword density"""
        score = 0
        max_score = 10
        
        if not primary_keyword:
            return {'score': 5, 'max': max_score, 'density': 0}
        
        # Calculate word count and keyword count
        words = text_content.lower().split()
        total_words = len(words)
        keyword_count = text_content.lower().count(primary_keyword.lower())
        
        if total_words == 0:
            self.issues.append("No text content found")
            return {'score': 0, 'max': max_score, 'density': 0}
        
        # Calculate density (percentage)
        density = (keyword_count / total_words) * 100
        
        # Ideal: 1-2%
        if 1.0 <= density <= 2.0:
            score += 10
        elif 0.5 <= density < 1.0 or 2.0 < density <= 3.0:
            score += 6
            self.recommendations.append(f"Keyword density ({density:.2f}%) is acceptable but 1-2% is ideal")
        elif density > 3.0:
            score += 2
            self.issues.append(f"Keyword density ({density:.2f}%) is too high - may be keyword stuffing")
        else:
            score += 3
            self.issues.append(f"Keyword density ({density:.2f}%) is too low - use keyword more naturally")
        
        return {
            'score': score,
            'max': max_score,
            'density': round(density, 2),
            'keyword_count': keyword_count,
            'total_words': total_words
        }
    
    def audit_content_length(self, text_content: str) -> Dict:
        """Audit content word count"""
        score = 0
        max_score = 10
        
        words = text_content.split()
        word_count = len(words)
        
        # Ideal: 800-1500 words for SEO
        if 800 <= word_count <= 1500:
            score += 10
        elif 600 <= word_count < 800 or 1500 < word_count <= 2000:
            score += 7
            self.recommendations.append(f"Word count ({word_count}) is good but 800-1500 is ideal for SEO")
        elif word_count < 600:
            score += 3
            self.issues.append(f"Content is too short ({word_count} words) - aim for 800-1500")
        else:
            score += 8  # Long content is OK
        
        return {'score': score, 'max': max_score, 'word_count': word_count}
    
    def audit_internal_links(self, html_content: str, base_domain: str = 'lifetrekmedical.com.br') -> Dict:
        """Audit internal linking"""
        score = 0
        max_score = 10
        
        soup = BeautifulSoup(html_content, 'html.parser')
        all_links = soup.find_all('a', href=True)
        
        internal_links = [
            link for link in all_links
            if base_domain in link['href'] or link['href'].startswith('/')
        ]
        
        internal_count = len(internal_links)
        
        # Ideal: 3-5 internal links
        if 3 <= internal_count <= 5:
            score += 10
        elif 2 <= internal_count < 3 or 5 < internal_count <= 7:
            score += 7
            self.recommendations.append(f"Internal links ({internal_count}) are OK but 3-5 is ideal")
        elif internal_count < 2:
            score += 3
            self.issues.append(f"Too few internal links ({internal_count}) - add links to Products, Contact, other posts")
        else:
            score += 5
        
        return {'score': score, 'max': max_score, 'count': internal_count}
    
    def audit_images(self, html_content: str) -> Dict:
        """Audit image optimization"""
        score = 0
        max_score = 10
        
        soup = BeautifulSoup(html_content, 'html.parser')
        images = soup.find_all('img')
        
        if not images:
            self.recommendations.append("No images found - consider adding relevant images")
            return {'score': 5, 'max': max_score, 'total': 0, 'with_alt': 0}
        
        images_with_alt = [img for img in images if img.get('alt')]
        alt_coverage = len(images_with_alt) / len(images) * 100
        
        # All images should have alt text
        if alt_coverage == 100:
            score += 10
        elif alt_coverage >= 80:
            score += 7
            self.recommendations.append(f"Alt text coverage ({alt_coverage:.0f}%) is good but aim for 100%")
        else:
            score += 3
            self.issues.append(f"Alt text coverage ({alt_coverage:.0f}%) is too low - add alt text to all images")
        
        return {
            'score': score,
            'max': max_score,
            'total': len(images),
            'with_alt': len(images_with_alt),
            'coverage': round(alt_coverage, 1)
        }
    
    def audit_schema_markup(self, html_content: str) -> Dict:
        """Check for schema.org structured data"""
        score = 0
        max_score = 10
        
        # Check for JSON-LD schema
        if 'application/ld+json' in html_content:
            score += 10
            
            # Validate it's Article schema
            if '"@type": "Article"' in html_content or '"@type":"Article"' in html_content:
                self.recommendations.append("✓ Article schema markup found")
            else:
                score = 7
                self.recommendations.append("Schema markup found but not Article type")
        else:
            self.issues.append("No schema.org structured data found - add Article schema")
        
        return {'score': score, 'max': max_score}
    
    def calculate_total_score(self, post_data: Dict) -> Dict:
        """Calculate overall SEO score"""
        self.scores = {}
        self.issues = []
        self.recommendations = []
        
        # Extract data
        html_content = post_data.get('content', '')
        title = post_data.get('seo_title') or post_data.get('title', '')
        description = post_data.get('seo_description') or post_data.get('excerpt', '')
        keywords = post_data.get('keywords', [])
        primary_keyword = keywords[0] if keywords else None
        
        # Get text content (strip HTML)
        soup = BeautifulSoup(html_content, 'html.parser')
        text_content = soup.get_text()
        
        # Run all audits
        self.scores['title'] = self.audit_title(title, primary_keyword)
        self.scores['meta_description'] = self.audit_meta_description(description, primary_keyword)
        self.scores['headers'] = self.audit_headers(html_content)
        self.scores['keyword_density'] = self.audit_keyword_density(text_content, primary_keyword)
        self.scores['content_length'] = self.audit_content_length(text_content)
        self.scores['internal_links'] = self.audit_internal_links(html_content)
        self.scores['images'] = self.audit_images(html_content)
        self.scores['schema'] = self.audit_schema_markup(html_content)
        
        # Calculate totals
        total_score = sum(s['score'] for s in self.scores.values())
        max_score = sum(s['max'] for s in self.scores.values())
        percentage = (total_score / max_score * 100) if max_score > 0 else 0
        
        # Determine grade
        if percentage >= 90:
            grade = 'A'
            status = 'Excellent SEO'
        elif percentage >= 80:
            grade = 'B'
            status = 'Good SEO'
        elif percentage >= 70:
            grade = 'C'
            status = 'Fair SEO'
        elif percentage >= 60:
            grade = 'D'
            status = 'Needs Improvement'
        else:
            grade = 'F'
            status = 'Poor SEO'
        
        return {
            'total_score': total_score,
            'max_score': max_score,
            'percentage': round(percentage, 1),
            'grade': grade,
            'status': status,
            'breakdown': self.scores,
            'issues': self.issues,
            'recommendations': self.recommendations
        }


def fetch_post_from_db(post_slug: str = None) -> List[Dict]:
    """Fetch blog post(s) from Supabase"""
    try:
        url = f'{SUPABASE_URL}/rest/v1/blog_posts'
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
        }
        
        if post_slug:
            params = {'slug': f'eq.{post_slug}', 'select': '*'}
        else:
            params = {'status': 'eq.published', 'select': '*'}
        
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error fetching posts: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        return []


def main():
    parser = argparse.ArgumentParser(description='SEO audit for Lifetrek Medical blog posts')
    parser.add_argument('--slug', type=str, help='Blog post slug to audit')
    parser.add_argument('--all', action='store_true', help='Audit all published posts')
    parser.add_argument('--output', type=str, help='Output JSON file path')
    
    args = parser.parse_args()
    
    auditor = SEOAuditor()
    
    # Fetch posts
    if args.slug:
        posts = fetch_post_from_db(args.slug)
        if not posts:
            print(f"❌ Post not found: {args.slug}")
            sys.exit(1)
    elif args.all:
        posts = fetch_post_from_db()
        if not posts:
            print("⚠️  No published posts found")
            sys.exit(0)
    else:
        parser.print_help()
        sys.exit(1)
    
    # Audit posts
    results = []
    
    print(f"\n🔍 SEO Audit: {len(posts)} post(s)\n")
    print("="*80)
    
    for post in posts:
        print(f"\n📝 {post['title']}")
        print(f"   Slug: {post['slug']}")
        
        result = auditor.calculate_total_score(post)
        result['post_title'] = post['title']
        result['post_slug'] = post['slug']
        result['audited_at'] = datetime.now().isoformat()
        
        results.append(result)
        
        # Print summary
        print(f"   Score: {result['total_score']}/{result['max_score']} ({result['percentage']}%)")
        print(f"   Grade: {result['grade']} - {result['status']}")
        
        if result['issues']:
            print(f"\n   ❌ Issues ({len(result['issues'])}):")
            for issue in result['issues'][:3]:  # Show top 3
                print(f"      • {issue}")
        
        if result['recommendations']:
            print(f"\n   💡 Recommendations ({len(result['recommendations'])}):")
            for rec in result['recommendations'][:3]:  # Show top 3
                print(f"      • {rec}")
        
        print("   " + "-"*76)
    
    print("\n" + "="*80)
    print(f"📊 Overall Summary:")
    
    avg_score = sum(r['percentage'] for r in results) / len(results) if results else 0
    print(f"   Average Score: {avg_score:.1f}%")
    
    grade_counts = {}
    for r in results:
        grade_counts[r['grade']] = grade_counts.get(r['grade'], 0) + 1
    
    print(f"   Grade Distribution: {dict(grade_counts)}")
    
    # Save to file if requested
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump({
                'audit_date': datetime.now().isoformat(),
                'total_posts': len(results),
                'average_score': round(avg_score, 1),
                'posts': results
            }, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Results saved to: {args.output}")
    
    print()


if __name__ == '__main__':
    main()
