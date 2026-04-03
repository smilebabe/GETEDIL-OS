import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import CountVectorizer

def calculate_match_score(user_profile, job_listing):
    """
    GETEDIL-OS Ranking Engine: P19 Identity <-> P4 Jobs Matching logic.
    Weights: Skills (60%), Proximity (20%), Trust (20%).
    """
    
    # 1. Skill Overlap (60%) - Vector Distance Approach
    # user_profile['skills'] = ['React', 'Python', 'PostgreSQL']
    # job_listing['required_skills'] = ['React', 'Next.js', 'PostgreSQL']
    
    user_skills = " ".join(user_profile.get('skills', []))
    required_skills = " ".join(job_listing.get('required_skills', []))
    
    if not user_skills or not required_skills:
        skill_score = 0
    else:
        vectorizer = CountVectorizer().fit_transform([user_skills, required_skills])
        vectors = vectorizer.toarray()
        skill_score = cosine_similarity(vectors)[0][1] * 100

    # 2. Proximity (20%) - Ethiopian Regional Coordinates (Euclidean Approximation)
    # coords = [latitude, longitude]
    user_coords = np.array(user_profile.get('coordinates', [9.03, 38.74])) # Default Addis
    job_coords = np.array(job_listing.get('coordinates', [9.03, 38.74]))
    
    # Max distance threshold for Ethiopia ~1000km (approx 9.0 degrees)
    distance = np.linalg.norm(user_coords - job_coords)
    proximity_score = max(0, 100 - (distance * 11.1)) # 1 degree ~ 111km; scaled to 100

    # 3. Trust Score (20%) - P3/P19 Verification Status
    # user_profile['trust_level'] range 0.0 to 1.0 (e.g., KYC Verified = 1.0)
    trust_factor = user_profile.get('trust_level', 0.5) 
    trust_score = trust_factor * 100

    # Weighted Aggregation
    final_score = (
        (skill_score * 0.60) + 
        (proximity_score * 0.20) + 
        (trust_score * 0.20)
    )

    return round(float(final_score), 2)

# Integration Logic:
# score = calculate_match_score(p19_data, p4_data)
# supabase.table('p4_jobs').update({'match_score': score}).eq('id', job_id).execute()
