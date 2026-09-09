import { useState, useEffect } from 'react';
import { FeatherIcon } from './IconMap';
import { getServices } from '../firebase/api';
import './Services.css';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  if (loading) {
    return (
      <section className="services section bg-light" id="services">
        <div className="container">
          <h2 className="section-title">SERVICES</h2>
          <div className="services-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '8px' }}></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="services section bg-light" id="services">
      <div className="container">
        <h2 className="section-title">SERVICES</h2>
        <div className="services-grid">
          {services.map(service => (
            <div className="service-card" key={service.id}>
              <div className="service-icon-wrapper">
                <div className="service-icon-placeholder">
                  <FeatherIcon
                    iconName={service.icon}
                    size={48}
                    color="var(--color-accent)"
                  />
                </div>
              </div>
              <h3 className="service-title">{service.title_thai}</h3>
              <p className="service-desc">{service.description_thai}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;

