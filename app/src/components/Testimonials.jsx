import { useState, useEffect } from 'react';
import MarqueeLib from 'react-fast-marquee';
import { getReviews, getSettings } from '../firebase/api';
import './Testimonials.css';

// Handle ESM export issue in v1.6.5
const Marquee = MarqueeLib?.default || MarqueeLib;

const Testimonials = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSection, setShowSection] = useState(true);

  useEffect(() => {
    getReviews()
      .then(data => {
        setReviews(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch reviews:', err);
        setLoading(false);
      });

    getSettings()
      .then(data => {
        const obj = {};
        data.forEach(s => { obj[s.setting_key] = s.setting_value; });
        setShowSection(obj.show_reviews !== false);
      })
      .catch(err => console.error('Failed to fetch settings:', err));
  }, []);

  if (!showSection) return null;

  return (
    <section className="testimonials section" id="reviews">
      <div className="container" data-aos="fade-up">
        <h2 className="section-title text-center">CLIENT REVIEWS</h2>
        {loading ? (
          <p className="text-center" style={{ padding: '2rem' }}>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-center" style={{ padding: '2rem', color: '#666' }}>No reviews available</p>
        ) : (
          <div className="reviews-marquee-wrapper" style={{ marginTop: '3rem' }}>
            <Marquee gradient={true} gradientColor={[239, 235, 228]} speed={40} pauseOnHover={true}>
              {reviews.map(review => (
                <div className="review-card" key={review.id} style={{ marginLeft: '1rem', marginRight: '1rem', minWidth: '350px' }}>
                  <div className="stars">
                    {'★'.repeat(review.stars)}
                  </div>
                  <p className="review-text">"{review.text}"</p>
                  <div className="review-author">
                    <div className="author-avatar">{review.name.charAt(0)}</div>
                    <div className="author-info">
                      <h4>{review.name}</h4>
                      <p>{review.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Marquee>
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;

