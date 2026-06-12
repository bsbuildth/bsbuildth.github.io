import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import ToggleSwitch from '../components/ToggleSwitch';
import './Admin.css';
import {
  getAllProjects, getProject, getAllReviews, getAllCalculatorTypes, getAllServices,
  getBusinessInfo, getAllContent, getSettings, getAllReferences, getMenus,
  getImages, getContacts, getAllArticles, getContentByKey, addItem, updateItem, deleteItem, setItem,
  fileToResizedDataURL,
} from '../firebase/api';

// Old image paths are absolute (/website/uploads/..) or data URLs — both render
// as-is, so the base prefix used throughout the JSX is empty now.
const API = '';

const Admin = ({ setIsAuthenticated }) => {
  const [projects, setProjects] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [editingContactId, setEditingContactId] = useState(null);
  const [contactEdit, setContactEdit] = useState({ name: '', contact_info: '', email: '', message: '' });
  const [articles, setArticles] = useState([]);
  const [artTitle, setArtTitle] = useState('');
  const [artSlug, setArtSlug] = useState('');
  const [artCategory, setArtCategory] = useState('ความรู้');
  const [artExcerpt, setArtExcerpt] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artCover, setArtCover] = useState(null);
  const [editingArtId, setEditingArtId] = useState(null);
  const [title, setTitle] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [projectCategory, setProjectCategory] = useState('renovation');
  const [projectDescription, setProjectDescription] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [managingImagesForProject, setManagingImagesForProject] = useState(null);
  const [processImageFile, setProcessImageFile] = useState(null);
  const [processImageCaption, setProcessImageCaption] = useState('');
  const [projectProcessImages, setProjectProcessImages] = useState([]);
  const [expandedImageId, setExpandedImageId] = useState(null);
  const [hoveredImageId, setHoveredImageId] = useState(null);
  const [hoveredDeleteBtnId, setHoveredDeleteBtnId] = useState(null);
  const [calculatorTypes, setCalculatorTypes] = useState([]);
  const [calcTypeName, setCalcTypeName] = useState('');
  const [calcTypePrice, setCalcTypePrice] = useState('');
  const [calcTypeImage, setCalcTypeImage] = useState(null);
  const [calcTypeSortOrder, setCalcTypeSortOrder] = useState('0');
  const [editingCalcTypeId, setEditingCalcTypeId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewName, setReviewName] = useState('');
  const [reviewRole, setReviewRole] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewStars, setReviewStars] = useState('5');
  const [reviewVisible, setReviewVisible] = useState(true);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [businessInfo, setBusinessInfo] = useState({
    company_name: '',
    address: '',
    phone: '',
    email: '',
    line_id: '',
    messenger_url: '',
    facebook: '',
    map_url: '',
    landmark: ''
  });
  const [websiteContent, setWebsiteContent] = useState([]);
  const [contentKey, setContentKey] = useState('');
  const [contentName, setContentName] = useState('');
  const [contentValue, setContentValue] = useState('');
  const [editingContentId, setEditingContentId] = useState(null);
  const [dbServices, setDbServices] = useState([]);
  const [serviceIcon, setServiceIcon] = useState('');
  const [serviceTitleThai, setServiceTitleThai] = useState('');
  const [serviceDescThai, setServiceDescThai] = useState('');
  const [serviceSortOrder, setServiceSortOrder] = useState('0');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [websiteSettings, setWebsiteSettings] = useState({
    projects_count: '500',
    team_count: '30',
    satisfaction_percent: '95',
    show_about_stats: true,
    show_reviews: true,
    show_hero: true,
    show_beforeafter: true,
    show_projects: true,
    show_reference: true,
    show_calculator: true,
    show_about: true,
    show_services: true,
    show_blog: true,
    show_process: true,
    notif_email: true,
    notif_line: true,
    notif_messenger: true
  });
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [savingHeroText, setSavingHeroText] = useState(false);
  const [heroBgImage, setHeroBgImage] = useState(null);
  const [heroBgFile, setHeroBgFile] = useState(null);
  const [heroBgUploading, setHeroBgUploading] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    email:    { enabled: false, config: { email_user: '', email_password: '', notify_to: '' } },
    line:     { enabled: false, config: { channel_access_token: '', admin_user_id: '' } },
    facebook: { enabled: false, config: { page_access_token: '', admin_psid: '' } }
  });
  const [notifTestResult, setNotifTestResult] = useState({});
  const [notifTesting, setNotifTesting] = useState({});
  const [references, setReferences] = useState([]);
  const [refTitle, setRefTitle] = useState('');
  const [refCategory, setRefCategory] = useState('ทั่วไป');
  const [refImage, setRefImage] = useState(null);
  const [refSortOrder, setRefSortOrder] = useState('0');
  const [refRoomType, setRefRoomType] = useState('');
  const [refStyle, setRefStyle] = useState('');
  const [refColorTone, setRefColorTone] = useState('');
  const [refDetail, setRefDetail] = useState('');
  const [editingRefId, setEditingRefId] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [menus, setMenus] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchContacts();
    fetchCalculatorTypes();
    fetchReviews();
    fetchBusinessInfo();
    fetchWebsiteContent();
    fetchDatabaseServices();
    fetchWebsiteSettings();
    fetchReferences();
    fetchNotifSettings();
    fetchMenus();
    fetchHeroBg();
    fetchArticles();
    fetchHeroText();
  }, []);

  const fetchHeroText = async () => {
    try {
      const [t, d] = await Promise.all([
        getContentByKey('hero_title'),
        getContentByKey('hero_description'),
      ]);
      setHeroTitle(t.thai_content || '');
      setHeroSubtitle(d.thai_content || '');
    } catch (err) { console.error(err); }
  };

  const handleSaveHeroText = async () => {
    setSavingHeroText(true);
    try {
      await setItem('content', 'hero_title', { section_key: 'hero_title', section_name: 'Hero', thai_content: heroTitle, is_visible: 1 });
      await setItem('content', 'hero_description', { section_key: 'hero_description', section_name: 'Hero', thai_content: heroSubtitle, is_visible: 1 });
      fetchWebsiteContent();
      alert('บันทึกข้อความ Hero แล้ว!');
    } catch (err) {
      alert('❌ ' + err.message);
    } finally {
      setSavingHeroText(false);
    }
  };

  const fetchArticles = () => {
    getAllArticles().then(data => setArticles(data)).catch(err => console.error(err));
  };

  const slugify = (s) => (s || '')
    .toString().trim().toLowerCase()
    .replace(/[\s/]+/g, '-')
    .replace(/[^฀-๿a-z0-9-]/g, '')
    .replace(/-+/g, '-').replace(/^-|-$/g, '') || ('post-' + Date.now());

  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!artTitle.trim()) { alert('กรุณากรอกหัวข้อบทความ'); return; }
    try {
      const payload = {
        title: artTitle.trim(),
        slug: (artSlug.trim() || slugify(artTitle)),
        category: artCategory.trim(),
        excerpt: artExcerpt.trim(),
        content: artContent,
      };
      if (artCover) payload.cover = await fileToResizedDataURL(artCover);
      if (editingArtId) {
        await updateItem('articles', editingArtId, payload);
      } else {
        await addItem('articles', { ...payload, is_visible: 1, sort_order: articles.length, created_at: new Date().toISOString() });
      }
      setArtTitle(''); setArtSlug(''); setArtCategory('ความรู้'); setArtExcerpt('');
      setArtContent(''); setArtCover(null); setEditingArtId(null);
      fetchArticles();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };
  const handleEditArticle = (a) => {
    setEditingArtId(a.id);
    setArtTitle(a.title || ''); setArtSlug(a.slug || ''); setArtCategory(a.category || 'ความรู้');
    setArtExcerpt(a.excerpt || ''); setArtContent(a.content || ''); setArtCover(null);
    window.scrollTo({ top: document.getElementById('article-form')?.offsetTop - 80, behavior: 'smooth' });
  };
  const handleDeleteArticle = async (id) => {
    if (!window.confirm('ลบบทความนี้?')) return;
    await deleteItem('articles', id);
    fetchArticles();
  };
  const handleToggleArticleVisible = async (a) => {
    await updateItem('articles', a.id, { is_visible: (a.is_visible === 0 || a.is_visible === false) ? 1 : 0 });
    fetchArticles();
  };
  const cancelEditArticle = () => {
    setEditingArtId(null); setArtTitle(''); setArtSlug(''); setArtCategory('ความรู้');
    setArtExcerpt(''); setArtContent(''); setArtCover(null);
  };

  const fetchHeroBg = () => {
    getImages('hero')
      .then(data => {
        const bg = Array.isArray(data) ? data.find(i => i.image_key === 'hero_background') : null;
        if (bg) setHeroBgImage(bg);
      })
      .catch(err => console.error(err));
  };

  const handleUploadHeroBg = async () => {
    if (!heroBgFile) { alert('กรุณาเลือกไฟล์รูปก่อน'); return; }
    setHeroBgUploading(true);
    try {
      const isVideo = heroBgFile.type.startsWith('video/');
      const dataUrl = await fileToResizedDataURL(heroBgFile, 1600, 0.82);
      await setItem('images', 'hero_background', {
        image_key: 'hero_background',
        image_category: 'hero',
        image_path: dataUrl,
        media_type: isVideo ? 'video' : 'image',
        sort_order: 0,
      });
      alert('✅ อัปเดตรูป Hero Background สำเร็จ! กรุณา reload หน้าเว็บเพื่อดูผล');
      setHeroBgFile(null);
      fetchHeroBg();
    } catch (err) {
      alert('❌ ' + err.message);
    }
    setHeroBgUploading(false);
  };

  const fetchMenus = () => {
    getMenus().then(data => setMenus(data)).catch(err => console.error(err));
  };

  const handleUpdateMenu = async (id, thai, eng) => {
    try {
      await updateItem('menus', id, { label_thai: thai, label_english: eng });
      alert('Menu updated successfully!');
      fetchMenus();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWebsiteContent = () => {
    getAllContent().then(data => setWebsiteContent(data)).catch(err => console.error(err));
  };

  const fetchDatabaseServices = () => {
    getAllServices().then(data => setDbServices(data)).catch(err => console.error(err));
  };

  const fetchWebsiteSettings = () => {
    getSettings()
      .then(data => {
        const settingsObj = {};
        data.forEach(s => { settingsObj[s.setting_key] = s.setting_value; });
        setWebsiteSettings(settingsObj);
      })
      .catch(err => console.error(err));
  };

  const fetchReferences = () => {
    getAllReferences().then(data => setReferences(data)).catch(err => console.error(err));
  };

  // Notifications run server-side (email/LINE/FB) and aren't available on the
  // serverless static host — the section is hidden in the JSX below.
  const fetchNotifSettings = () => {};
  const handleSaveNotif = async () => {};
  const handleTestNotif = async () => {};

  // Save per-channel enable flags (read by the website + passed to Apps Script)
  const handleSaveNotifEnable = async () => {
    try {
      for (const key of ['notif_email', 'notif_line', 'notif_messenger']) {
        await setItem('settings', key, { setting_key: key, setting_value: websiteSettings[key] !== false });
      }
      alert('บันทึกการตั้งค่าแจ้งเตือนแล้ว!');
    } catch (err) {
      console.error(err);
      alert('❌ ' + err.message);
    }
  };

  const updateNotifConfig = (channel, field, value) => {
    setNotifSettings(prev => ({
      ...prev,
      [channel]: { ...prev[channel], config: { ...prev[channel].config, [field]: value } }
    }));
  };

  const handleAddReference = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: refRoomType,
        category: refCategory,
        sort_order: parseInt(refSortOrder) || 0,
        room_type: refRoomType,
        style: refStyle,
        color_tone: refColorTone,
        detail: refDetail,
      };
      if (refImage) payload.img_path = await fileToResizedDataURL(refImage);
      if (editingRefId) {
        await updateItem('references', editingRefId, payload);
      } else {
        await addItem('references', { ...payload, is_visible: 1 });
      }
      setRefTitle(''); setRefCategory('ทั่วไป'); setRefImage(null);
      setRefSortOrder('0'); setEditingRefId(null);
      setRefRoomType(''); setRefStyle(''); setRefColorTone(''); setRefDetail('');
      fetchReferences();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const handleEditReference = (ref) => {
    setEditingRefId(ref.id);
    setRefTitle(ref.title);
    setRefCategory(ref.category);
    setRefSortOrder(String(ref.sort_order));
    setRefRoomType(ref.room_type || '');
    setRefStyle(ref.style || '');
    setRefColorTone(ref.color_tone || '');
    setRefDetail(ref.detail || '');
    setRefImage(null);
    window.scrollTo({ top: document.getElementById('ref-form')?.offsetTop - 80, behavior: 'smooth' });
  };

  const handleDeleteReference = async (id) => {
    if (!window.confirm('ลบรูป Reference นี้?')) return;
    await deleteItem('references', id);
    fetchReferences();
  };

  const handleToggleRefVisible = async (ref) => {
    await updateItem('references', ref.id, { is_visible: ref.is_visible ? 0 : 1 });
    fetchReferences();
  };

  // shown unless explicitly turned off (matches the public-site default)
  const isShown = (it) => it.is_visible !== 0 && it.is_visible !== false;
  const handleToggleProjectVisible = async (p) => {
    await updateItem('projects', p.id, { is_visible: isShown(p) ? 0 : 1 });
    fetchProjects();
  };
  const handleToggleCalcVisible = async (c) => {
    await updateItem('calculator_types', c.id, { is_visible: isShown(c) ? 0 : 1 });
    fetchCalculatorTypes();
  };
  const handleToggleServiceVisible = async (s) => {
    await updateItem('services', s.id, { is_visible: isShown(s) ? 0 : 1 });
    fetchDatabaseServices();
  };
  const handleToggleContentVisible = async (c) => {
    await updateItem('content', c.id, { is_visible: isShown(c) ? 0 : 1 });
    fetchWebsiteContent();
  };
  const handleDeleteContact = async (id) => {
    if (!window.confirm('ลบข้อความนี้?')) return;
    await deleteItem('contacts', id);
    fetchContacts();
  };
  const handleEditContact = (c) => {
    setEditingContactId(c.id);
    setContactEdit({ name: c.name || '', contact_info: c.contact_info || '', email: c.email || '', message: c.message || '' });
  };
  const handleUpdateContact = async () => {
    await updateItem('contacts', editingContactId, contactEdit);
    setEditingContactId(null);
    fetchContacts();
  };

  const handleToggleReviewVisible = async (review) => {
    await updateItem('reviews', review.id, { is_visible: review.is_visible === 1 ? 0 : 1 });
    fetchReviews();
  };

  const fetchProjects = () => {
    getAllProjects().then(data => setProjects(data)).catch(err => console.error(err));
  };

  const fetchContacts = () => {
    getContacts().then(data => setContacts(data)).catch(err => console.error(err));
  };

  const fetchCalculatorTypes = () => {
    getAllCalculatorTypes().then(data => setCalculatorTypes(data)).catch(err => console.error(err));
  };

  const fetchReviews = () => {
    getAllReviews().then(data => setReviews(data)).catch(err => console.error(err));
  };

  const fetchBusinessInfo = () => {
    getBusinessInfo()
      .then(data => {
        setBusinessInfo({
          company_name: data.company_name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          line_id: data.line_id || '',
          messenger_url: data.messenger_url || '',
          facebook: data.facebook || '',
          map_url: data.map_url || '',
          landmark: data.landmark || ''
        });
      })
      .catch(err => console.error(err));
  };

  const handleAddProject = async (e) => {
    e.preventDefault();

    if (!title) { alert('กรุณาใส่ชื่อโครงการ'); return; }
    if (!editingProjectId && !imageFile) { alert('กรุณาเลือกรูปภาพ'); return; }

    try {
      const payload = {
        title,
        category: projectCategory,
        description: projectDescription,
      };
      if (imageFile) payload.img = await fileToResizedDataURL(imageFile);
      if (editingProjectId) {
        await updateItem('projects', editingProjectId, payload);
      } else {
        await addItem('projects', { ...payload, sort_order: projects.length, process_images: [] });
      }
      setTitle(''); setImageFile(null); setProjectCategory('renovation');
      setProjectDescription(''); setEditingProjectId(null);
      fetchProjects();
      alert('✅ บันทึกสำเร็จ!');
    } catch (err) {
      console.error(err);
      alert('❌ เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleEditProject = (p) => {
    setEditingProjectId(p.id);
    setTitle(p.title);
    setProjectCategory(p.category || 'renovation');
    setProjectDescription(p.description || '');
    setImageFile(null);
    window.scrollTo({ top: document.querySelector('.admin-section').offsetTop - 80, behavior: 'smooth' });
  };

  const handleCancelEditProject = () => {
    setEditingProjectId(null);
    setTitle(''); setImageFile(null);
    setProjectCategory('renovation'); setProjectDescription('');
  };

  const dragProjectIdx = React.useRef(null);
  const dragOverProjectIdx = React.useRef(null);
  const [dragOverId, setDragOverId] = React.useState(null);

  const handleProjectDragStart = (idx) => {
    dragProjectIdx.current = idx;
  };

  const handleProjectDragOver = (e, idx, id) => {
    e.preventDefault();
    dragOverProjectIdx.current = idx;
    setDragOverId(id);
  };

  const handleProjectDragLeave = () => {
    setDragOverId(null);
  };

  const handleProjectDrop = async () => {
    setDragOverId(null);
    const from = dragProjectIdx.current;
    const to = dragOverProjectIdx.current;
    if (from === null || to === null || from === to) return;
    const newProjects = [...projects];
    const [moved] = newProjects.splice(from, 1);
    newProjects.splice(to, 0, moved);
    setProjects(newProjects);
    dragProjectIdx.current = null;
    dragOverProjectIdx.current = null;
    await Promise.all(newProjects.map((p, i) => updateItem('projects', p.id, { sort_order: i })));
  };

  // ── drag-to-reorder for Reference images ──
  const dragRefIdx = React.useRef(null);
  const dragOverRefIdx = React.useRef(null);
  const [dragOverRefId, setDragOverRefId] = React.useState(null);

  const handleRefDragStart = (idx) => { dragRefIdx.current = idx; };
  const handleRefDragOver = (e, idx, id) => { e.preventDefault(); dragOverRefIdx.current = idx; setDragOverRefId(id); };
  const handleRefDragLeave = () => setDragOverRefId(null);
  const handleRefDrop = async () => {
    setDragOverRefId(null);
    const from = dragRefIdx.current;
    const to = dragOverRefIdx.current;
    if (from === null || to === null || from === to) return;
    const list = [...references];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setReferences(list);
    dragRefIdx.current = null;
    dragOverRefIdx.current = null;
    await Promise.all(list.map((r, i) => updateItem('references', r.id, { sort_order: i })));
  };

  const handleManageImages = async (project) => {
    setManagingImagesForProject(project);
    const data = await getProject(project.id);
    setProjectProcessImages(data?.process_images || []);
  };

  const handleAddProcessImage = async (e) => {
    e.preventDefault();
    if (!processImageFile) { alert('กรุณาเลือกรูปภาพ'); return; }
    try {
      const img_path = await fileToResizedDataURL(processImageFile);
      const next = [...projectProcessImages, { id: Date.now(), img_path, caption: processImageCaption }];
      await updateItem('projects', managingImagesForProject.id, { process_images: next });
      setProcessImageFile(null); setProcessImageCaption('');
      handleManageImages(managingImagesForProject);
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const handleDeleteProcessImage = async (imgId) => {
    if (!window.confirm('ลบรูปนี้?')) return;
    const next = projectProcessImages.filter(i => i.id !== imgId);
    await updateItem('projects', managingImagesForProject.id, { process_images: next });
    handleManageImages(managingImagesForProject);
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('ต้องการลบโครงการนี้?')) return;
    try {
      await deleteItem('projects', id);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCalculatorType = async (e) => {
    e.preventDefault();
    if (!calcTypeName || !calcTypePrice) {
      alert('Please fill type name and price.');
      return;
    }

    try {
      const payload = {
        type_name: calcTypeName,
        base_price: parseFloat(calcTypePrice) || 0,
        sort_order: parseInt(calcTypeSortOrder) || 0,
      };
      if (calcTypeImage) payload.example_image_path = await fileToResizedDataURL(calcTypeImage);
      if (editingCalcTypeId) {
        await updateItem('calculator_types', editingCalcTypeId, payload);
      } else {
        await addItem('calculator_types', payload);
      }
      setCalcTypeName('');
      setCalcTypePrice('');
      setCalcTypeImage(null);
      setCalcTypeSortOrder('0');
      setEditingCalcTypeId(null);
      fetchCalculatorTypes();
    } catch (err) {
      console.error(err);
      alert('❌ ' + err.message);
    }
  };

  const handleEditCalculatorType = (type) => {
    setEditingCalcTypeId(type.id);
    setCalcTypeName(type.type_name);
    setCalcTypePrice(type.base_price);
    setCalcTypeSortOrder(type.sort_order);
    setCalcTypeImage(null);
  };

  const handleDeleteCalculatorType = async (id) => {
    if (!window.confirm('Are you sure you want to delete this calculator type?')) return;
    try {
      await deleteItem('calculator_types', id);
      fetchCalculatorTypes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingCalcTypeId(null);
    setCalcTypeName('');
    setCalcTypePrice('');
    setCalcTypeImage(null);
    setCalcTypeSortOrder('0');
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!reviewName || !reviewRole || !reviewText) {
      alert('Please fill name, role, and text.');
      return;
    }

    const reviewData = {
      name: reviewName,
      role: reviewRole,
      text: reviewText,
      stars: parseInt(reviewStars),
      is_visible: reviewVisible ? 1 : 0
    };

    try {
      if (editingReviewId) {
        await updateItem('reviews', editingReviewId, reviewData);
      } else {
        await addItem('reviews', { ...reviewData, sort_order: reviews.length });
      }
      setReviewName('');
      setReviewRole('');
      setReviewText('');
      setReviewStars('5');
      setReviewVisible(true);
      setEditingReviewId(null);
      fetchReviews();
    } catch (err) {
      console.error(err);
      alert('❌ ' + err.message);
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review.id);
    setReviewName(review.name);
    setReviewRole(review.role);
    setReviewText(review.text);
    setReviewStars(review.stars);
    setReviewVisible(review.is_visible === 1);
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteItem('reviews', id);
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelReviewEdit = () => {
    setEditingReviewId(null);
    setReviewName('');
    setReviewRole('');
    setReviewText('');
    setReviewStars('5');
    setReviewVisible(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBusinessInfo = async (e) => {
    e.preventDefault();
    try {
      await setItem('business_info', 'main', businessInfo);
      alert('Business info saved successfully!');
    } catch (err) {
      console.error(err);
      alert('❌ ' + err.message);
    }
  };

  const handleUpdateContent = async (id) => {
    if (!contentValue) {
      alert('Please enter content');
      return;
    }
    try {
      await setItem('content', id, { thai_content: contentValue });
      alert('Content updated successfully!');
      setEditingContentId(null);
      setContentValue('');
      fetchWebsiteContent();
    } catch (err) {
      console.error(err);
      alert('❌ ' + err.message);
    }
  };

  const handleEditContent = (content) => {
    setEditingContentId(content.id);
    setContentKey(content.section_key);
    setContentName(content.section_name);
    setContentValue(content.thai_content);
  };

  const handleCancelContentEdit = () => {
    setEditingContentId(null);
    setContentKey('');
    setContentName('');
    setContentValue('');
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceIcon || !serviceTitleThai || !serviceDescThai) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        icon: serviceIcon,
        title_thai: serviceTitleThai,
        description_thai: serviceDescThai,
        sort_order: parseInt(serviceSortOrder) || 0
      };
      if (editingServiceId) {
        await updateItem('services', editingServiceId, payload);
      } else {
        await addItem('services', payload);
      }
      alert(editingServiceId ? 'Service updated!' : 'Service created!');
      setServiceIcon('');
      setServiceTitleThai('');
      setServiceDescThai('');
      setServiceSortOrder('0');
      setEditingServiceId(null);
      fetchDatabaseServices();
    } catch (err) {
      console.error(err);
      alert('❌ ' + err.message);
    }
  };

  const handleEditService = (service) => {
    setEditingServiceId(service.id);
    setServiceIcon(service.icon);
    setServiceTitleThai(service.title_thai);
    setServiceDescThai(service.description_thai);
    setServiceSortOrder(service.sort_order);
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await deleteItem('services', id);
      fetchDatabaseServices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelServiceEdit = () => {
    setEditingServiceId(null);
    setServiceIcon('');
    setServiceTitleThai('');
    setServiceDescThai('');
    setServiceSortOrder('0');
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const keys = ['projects_count', 'team_count', 'satisfaction_percent'];
      for (const key of keys) {
        await setItem('settings', key, { setting_key: key, setting_value: websiteSettings[key] || '' });
      }
      // boolean settings — must persist false too (don't gate behind a truthy check)
      const boolKeys = [
        'show_about_stats', 'show_reviews', 'show_hero', 'show_beforeafter',
        'show_projects', 'show_reference', 'show_calculator', 'show_about', 'show_services', 'show_blog', 'show_process',
      ];
      for (const key of boolKeys) {
        await setItem('settings', key, { setting_key: key, setting_value: websiteSettings[key] !== false });
      }
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('❌ ' + err.message);
    }
  };

  return (
    <div className="admin-dashboard container">
      <header className="admin-header">
        <div className="admin-brand">
          <span className="admin-brand-logo">BS</span>
          <div>
            <h1>Admin Dashboard</h1>
            <p className="admin-brand-sub">BS Build — ระบบจัดการเว็บไซต์</p>
          </div>
        </div>
        <div className="admin-header-actions">
          <button onClick={() => navigate('/')} className="admin-btn admin-btn-ghost">
            ← กลับหน้าเว็บ
          </button>
          <button onClick={handleLogout} className="admin-btn admin-btn-danger">
            ออกจากระบบ
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        {[
          { key: 'inbox', label: '📥 กล่องข้อความ' },
          { key: 'projects', label: '🏗️ ผลงาน' },
          { key: 'references', label: '🖼️ รูปอ้างอิง' },
          { key: 'reviews', label: '⭐ รีวิว' },
          { key: 'services', label: '🛠️ บริการ' },
          { key: 'calculator', label: '🧮 คำนวณราคา' },
          { key: 'content', label: '📝 เนื้อหา' },
          { key: 'articles', label: '📰 บทความ' },
          { key: 'hero', label: '🎬 Hero' },
          { key: 'business', label: '🏢 ข้อมูลธุรกิจ' },
          { key: 'notifications', label: '🔔 แจ้งเตือน' },
          { key: 'settings', label: '⚙️ ตั้งค่า' },
        ].map(t => (
          <button
            key={t.key}
            className={`admin-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(t.key); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section className="admin-section" style={{ display: activeTab === 'business' ? 'block' : 'none' }}>
        <h2>Business Contact Information</h2>
        <form className="admin-form" onSubmit={handleSaveBusinessInfo}>
          <input
            type="text"
            placeholder="Company Name"
            value={businessInfo.company_name}
            onChange={e => setBusinessInfo({ ...businessInfo, company_name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Address"
            value={businessInfo.address}
            onChange={e => setBusinessInfo({ ...businessInfo, address: e.target.value })}
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={businessInfo.phone}
            onChange={e => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={businessInfo.email}
            onChange={e => setBusinessInfo({ ...businessInfo, email: e.target.value })}
          />
          <input
            type="text"
            placeholder="LINE ID (เช่น @bsbuild — ปุ่ม LINE จะโผล่เมื่อมีค่า)"
            value={businessInfo.line_id}
            onChange={e => setBusinessInfo({ ...businessInfo, line_id: e.target.value })}
          />
          <input
            type="text"
            placeholder="Messenger URL (เช่น https://m.me/yourpage — ปุ่ม Messenger จะโผล่เมื่อมีค่า)"
            value={businessInfo.messenger_url}
            onChange={e => setBusinessInfo({ ...businessInfo, messenger_url: e.target.value })}
          />
          <input
            type="text"
            placeholder="Facebook URL (เช่น https://www.facebook.com/bsbuild — ปุ่ม Facebook จะโผล่เมื่อมีค่า)"
            value={businessInfo.facebook}
            onChange={e => setBusinessInfo({ ...businessInfo, facebook: e.target.value })}
          />
          <input
            type="text"
            placeholder="Google Maps URL (เปิด Google Maps → ปักหมุดร้าน → แชร์ → คัดลอกลิงก์ มาวางที่นี่ เพื่อให้แผนที่ตรงเป๊ะ)"
            value={businessInfo.map_url}
            onChange={e => setBusinessInfo({ ...businessInfo, map_url: e.target.value })}
          />
          <input
            type="text"
            placeholder="จุดสังเกต / จุดสำคัญ (เช่น ใกล้ BTS อ่อนนุช, ตรงข้ามตลาด... — จะโชว์ในหน้าเว็บ)"
            value={businessInfo.landmark}
            onChange={e => setBusinessInfo({ ...businessInfo, landmark: e.target.value })}
          />
          <button type="submit" className="btn btn-solid">Save Business Info</button>
        </form>
      </section>

      <section className="admin-section" style={{ display: activeTab === 'projects' ? 'block' : 'none' }}>
        <h2>Manage Featured Projects</h2>

        {/* Expanded Image Viewer (Lightbox) – use display:none to avoid unmount/remount cycles */}
        {(() => {
          const expandedImg = expandedImageId && managingImagesForProject ?
            projectProcessImages.find(img => img.id === expandedImageId) : null;
          return (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: expandedImg ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}>
              <div style={{
                background: '#fff',
                borderRadius: 12,
                padding: '1.5rem',
                maxWidth: '90%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                textAlign: 'center',
                position: 'relative'
              }}>
                <button onClick={() => setExpandedImageId(null)} style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: '#e53e3e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}>✕</button>
                {expandedImg && (
                  <>
                    <img
                      src={`${API}${expandedImg.img_path}`}
                      alt="Expanded"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '70vh',
                        objectFit: 'contain',
                        marginBottom: '1rem',
                        borderRadius: 8
                      }}
                    />
                    {expandedImg.caption && (
                      <p style={{
                        fontSize: '1rem',
                        color: '#333',
                        margin: '1rem 0 0',
                        fontWeight: 500,
                        wordBreak: 'break-word'
                      }}>
                        {expandedImg.caption}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Manage Process Images Modal */}
        {managingImagesForProject && (
          <div key={`process-images-${managingImagesForProject.id}`} style={{ background: '#f0f4ff', border: '2px solid #4a6fa5', borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>📸 ภาพระหว่างดำเนินการ: {managingImagesForProject.title}</h3>
              <button onClick={() => setManagingImagesForProject(null)} style={{ background: '#ccc', border: 'none', borderRadius: 6, padding: '0.4rem 0.8rem', cursor: 'pointer' }}>✕ ปิด</button>
            </div>

            <form onSubmit={handleAddProcessImage} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <input type="file" accept="image/*" onChange={e => setProcessImageFile(e.target.files[0])} required style={{ flex: 1 }} />
              <input type="text" placeholder="คำอธิบายรูป (optional)" value={processImageCaption} onChange={e => setProcessImageCaption(e.target.value)} style={{ flex: 2, padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }} />
              <button type="submit" className="btn btn-solid" style={{ padding: '0.4rem 1rem' }}>+ เพิ่มรูป</button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
              {projectProcessImages.length === 0 && <p style={{ color: '#888' }}>ยังไม่มีรูปภาพระหว่างดำเนินการ</p>}
              {projectProcessImages.map(img => (
                <div
                  key={img.id}
                  style={{
                    position: 'relative',
                    textAlign: 'center',
                    border: '2px solid #ddd',
                    borderRadius: 8,
                    overflow: 'hidden',
                    padding: '0.5rem',
                    background: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: hoveredImageId === img.id ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
                    transform: hoveredImageId === img.id ? 'translateY(-2px)' : 'translateY(0)'
                  }}
                  onMouseEnter={() => setHoveredImageId(img.id)}
                  onMouseLeave={() => setHoveredImageId(null)}
                  onClick={() => setExpandedImageId(img.id)}
                >
                  <img
                    src={`${API}${img.img_path}`}
                    alt={img.caption}
                    style={{
                      width: '100%',
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 4,
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}
                  />
                  <div style={{ minHeight: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {img.caption ? (
                      <p style={{
                        fontSize: '0.8rem',
                        margin: '0.25rem 0',
                        color: '#555',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        flex: 1
                      }}>
                        {img.caption}
                      </p>
                    ) : (
                      <p style={{ fontSize: '0.8rem', margin: '0.25rem 0', color: '#aaa', fontStyle: 'italic' }}>
                        ไม่มีคำอธิบาย
                      </p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProcessImage(img.id);
                      }}
                      style={{
                        background: hoveredDeleteBtnId === img.id ? '#dc2626' : '#e53e3e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '0.25rem 0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        marginTop: '0.25rem',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={() => setHoveredDeleteBtnId(img.id)}
                      onMouseLeave={() => setHoveredDeleteBtnId(null)}
                    >
                      🗑️ ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form className="admin-form" onSubmit={handleAddProject}>
          <h3 style={{ margin: '0 0 0.75rem', color: '#444' }}>{editingProjectId ? '✏️ แก้ไขโครงการ' : '➕ เพิ่มโครงการใหม่'}</h3>
          <input
            type="text"
            placeholder="ชื่อโครงการ (เช่น ตกแต่งห้องนอนสมัยใหม่)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <select value={projectCategory} onChange={e => setProjectCategory(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc' }}>
            <option value="interior">ตกแต่งภายใน (Interior)</option>
            <option value="exterior">ต่อเติมภายนอก (Exterior)</option>
            <option value="renovation">รีโนเวท (Renovation)</option>
          </select>
          <textarea
            placeholder="รายละเอียดโครงการ (เช่น วัสดุที่ใช้, ขั้นตอนการทำงาน, ระยะเวลา)"
            value={projectDescription}
            onChange={e => setProjectDescription(e.target.value)}
            rows={3}
            style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', resize: 'vertical' }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={e => setImageFile(e.target.files[0])}
            {...(!editingProjectId && { required: true })}
          />
          {editingProjectId && <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>* เลือกรูปใหม่เฉพาะเมื่อต้องการเปลี่ยน</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-solid">{editingProjectId ? 'บันทึกการแก้ไข' : 'เพิ่มโครงการ'}</button>
            {editingProjectId && <button type="button" onClick={handleCancelEditProject} style={{ background: '#ccc', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer' }}>ยกเลิก</button>}
          </div>
        </form>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th style={{ width: 30 }}></th>
                <th>รูป</th>
                <th>ชื่อโครงการ</th>
                <th>หมวดหมู่</th>
                <th>รายละเอียด</th>
                <th>แสดง</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p, idx) => (
                <tr
                  key={p.id}
                  draggable
                  onDragStart={() => handleProjectDragStart(idx)}
                  onDragOver={(e) => handleProjectDragOver(e, idx, p.id)}
                  onDragLeave={handleProjectDragLeave}
                  onDrop={handleProjectDrop}
                  className={dragOverId === p.id ? 'drag-over' : ''}
                  style={{
                    background: editingProjectId === p.id ? '#fffbeb' : '',
                    transition: 'background 0.15s'
                  }}
                >
                  <td style={{ textAlign: 'center', color: '#aaa', fontSize: '0.8rem' }}>{idx + 1}</td>
                  <td style={{ textAlign: 'center', fontSize: '1.1rem', color: '#bbb', userSelect: 'none' }} title="ลากเพื่อเรียงลำดับ">⠿</td>
                  <td><img src={`${p.img.startsWith('http') ? '' : API}${p.img}`} alt="thumb" className="admin-thumb" /></td>
                  <td>{p.title}</td>
                  <td>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.8rem', background: p.category === 'interior' ? '#e8f5e9' : p.category === 'exterior' ? '#e3f2fd' : '#fce4ec', color: '#333' }}>
                      {p.category === 'interior' ? 'ภายใน' : p.category === 'exterior' ? 'ภายนอก' : 'รีโนเวท'}
                    </span>
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#666' }}>
                    {p.description || '-'}
                  </td>
                  <td><ToggleSwitch checked={isShown(p)} onChange={() => handleToggleProjectVisible(p)} /></td>
                  <td style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button onClick={() => handleEditProject(p)} style={{ background: '#4a6fa5', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>✏️ แก้ไข</button>
                    <button onClick={() => handleManageImages(p)} style={{ background: '#2d8a4e', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>📸 รูป</button>
                    <button onClick={() => handleDeleteProject(p.id)} className="btn-delete" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>🗑️ ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section" style={{ display: activeTab === 'calculator' ? 'block' : 'none' }}>
        <h2>Calculator Configuration</h2>

        <form className="admin-form" onSubmit={handleAddCalculatorType}>
          <input
            type="text"
            placeholder="Type Name (e.g. Interior (ห้องชั้นใน))"
            value={calcTypeName}
            onChange={e => setCalcTypeName(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Base Price (e.g. 5000)"
            value={calcTypePrice}
            onChange={e => setCalcTypePrice(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Sort Order"
            value={calcTypeSortOrder}
            onChange={e => setCalcTypeSortOrder(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={e => setCalcTypeImage(e.target.files[0])}
          />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-solid">
              {editingCalcTypeId ? 'Update Type' : 'Add Type'}
            </button>
            {editingCalcTypeId && (
              <button type="button" onClick={handleCancelEdit} className="btn btn-outline">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type Name</th>
                <th>Base Price</th>
                <th>Image</th>
                <th>Sort Order</th>
                <th>แสดง</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {calculatorTypes.map(t => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.type_name}</td>
                  <td>฿{t.base_price.toLocaleString()}</td>
                  <td>
                    {t.example_image_path && (
                      <img src={t.example_image_path} alt="example" className="admin-thumb" />
                    )}
                  </td>
                  <td>{t.sort_order}</td>
                  <td><ToggleSwitch checked={isShown(t)} onChange={() => handleToggleCalcVisible(t)} /></td>
                  <td>
                    <button onClick={() => handleEditCalculatorType(t)} className="btn-edit" style={{ marginRight: '0.5rem' }}>Edit</button>
                    <button onClick={() => handleDeleteCalculatorType(t.id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Reference Images ─── */}
      <section className="admin-section" id="ref-form" style={{ display: activeTab === 'references' ? 'block' : 'none' }}>
        <h2>Manage Reference Images</h2>

        <form className="admin-form ref-form" onSubmit={handleAddReference}>
          <h3>{editingRefId ? '✏️ แก้ไขรูป Reference' : '➕ เพิ่มรูป Reference ใหม่'}</h3>

          <div className="ref-form-grid">
            <div className="ref-field">
              <label>ประเภทห้อง *</label>
              <input value={refRoomType} onChange={e => setRefRoomType(e.target.value)} placeholder="เช่น ห้องนอน, ห้องครัว, ห้องนั่งเล่น" required />
            </div>
            <div className="ref-field">
              <label>หมวดหมู่</label>
              <input value={refCategory} onChange={e => setRefCategory(e.target.value)} placeholder="เช่น ห้องนั่งเล่น, ห้องนอน, ภายนอก" />
            </div>
            <div className="ref-field">
              <label>Style (สไตล์)</label>
              <input value={refStyle} onChange={e => setRefStyle(e.target.value)} placeholder="เช่น Modern, Luxury, Minimal" />
            </div>
            <div className="ref-field">
              <label>โทนสี</label>
              <input value={refColorTone} onChange={e => setRefColorTone(e.target.value)} placeholder="เช่น ขาว-ไม้, ดำ-ทอง" />
            </div>
            <div className="ref-field">
              <label>ลำดับการแสดง</label>
              <input type="number" value={refSortOrder} onChange={e => setRefSortOrder(e.target.value)} />
            </div>
            <div className="ref-field">
              <label>รูปภาพ {editingRefId ? '(เว้นว่างถ้าไม่เปลี่ยน)' : '*'}</label>
              <input className="ref-file" type="file" accept="image/*" onChange={e => setRefImage(e.target.files[0])} required={!editingRefId} />
            </div>
          </div>

          <div className="ref-field ref-field--full">
            <label>รายละเอียด</label>
            <textarea value={refDetail} onChange={e => setRefDetail(e.target.value)} rows="3" placeholder="อธิบายงาน / วัสดุ / จุดเด่น..." />
          </div>

          <div className="ref-actions">
            <button type="submit" className="btn-primary">{editingRefId ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มรูป'}</button>
            {editingRefId && <button type="button" className="btn-secondary" onClick={() => { setEditingRefId(null); setRefTitle(''); setRefCategory('ทั่วไป'); setRefSortOrder('0'); setRefImage(null); setRefRoomType(''); setRefStyle(''); setRefColorTone(''); setRefDetail(''); }}>ยกเลิก</button>}
          </div>
        </form>

        <table className="admin-table" style={{ marginTop: '1.5rem' }}>
          <thead>
            <tr>
              <th style={{ width: 30 }}></th>
              <th>รูป</th>
              <th>ชื่อ</th>
              <th>หมวด</th>
              <th>ลำดับ</th>
              <th>แสดง</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {references.map((ref, idx) => (
              <tr
                key={ref.id}
                draggable
                onDragStart={() => handleRefDragStart(idx)}
                onDragOver={(e) => handleRefDragOver(e, idx, ref.id)}
                onDragLeave={handleRefDragLeave}
                onDrop={handleRefDrop}
                className={dragOverRefId === ref.id ? 'drag-over' : ''}
              >
                <td style={{ textAlign: 'center', fontSize: '1.1rem', color: '#bbb', cursor: 'grab', userSelect: 'none' }} title="ลากเพื่อเรียงลำดับ">⠿</td>
                <td><img src={`${API}${ref.img_path}`} alt={ref.title} style={{ width: 70, height: 50, objectFit: 'cover', borderRadius: 4 }} /></td>
                <td>{ref.title}</td>
                <td>{ref.category}</td>
                <td style={{ textAlign: 'center', color: '#aaa' }}>{idx + 1}</td>
                <td>
                  <ToggleSwitch checked={!!ref.is_visible} onChange={() => handleToggleRefVisible(ref)} />
                </td>
                <td>
                  <button className="btn-edit" onClick={() => handleEditReference(ref)}>แก้ไข</button>
                  <button className="btn-delete" onClick={() => handleDeleteReference(ref.id)}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ─── Blog / Articles ─── */}
      <section className="admin-section" id="article-form" style={{ display: activeTab === 'articles' ? 'block' : 'none' }}>
        <h2>📰 จัดการบทความ (Blog)</h2>

        <form className="admin-form ref-form" onSubmit={handleSaveArticle}>
          <h3>{editingArtId ? '✏️ แก้ไขบทความ' : '➕ เขียนบทความใหม่'}</h3>
          <div className="ref-form-grid">
            <div className="ref-field">
              <label>หัวข้อบทความ *</label>
              <input value={artTitle} onChange={e => setArtTitle(e.target.value)} placeholder="เช่น 5 ไอเดียต่อเติมครัวไทยให้โปร่งโล่ง" required />
            </div>
            <div className="ref-field">
              <label>Slug (URL) — เว้นว่าง = สร้างอัตโนมัติ</label>
              <input value={artSlug} onChange={e => setArtSlug(e.target.value)} placeholder="เช่น kitchen-extension-ideas" />
            </div>
            <div className="ref-field">
              <label>หมวดหมู่</label>
              <input value={artCategory} onChange={e => setArtCategory(e.target.value)} placeholder="เช่น ความรู้, ไอเดีย" />
            </div>
            <div className="ref-field">
              <label>รูปปก {editingArtId ? '(เว้นว่างถ้าไม่เปลี่ยน)' : ''}</label>
              <input className="ref-file" type="file" accept="image/*" onChange={e => setArtCover(e.target.files[0])} />
            </div>
          </div>
          <div className="ref-field ref-field--full">
            <label>เกริ่นนำ (excerpt) — แสดงในการ์ด</label>
            <textarea value={artExcerpt} onChange={e => setArtExcerpt(e.target.value)} rows="2" placeholder="สรุปสั้นๆ 1-2 ประโยค" />
          </div>
          <div className="ref-field ref-field--full">
            <label>เนื้อหาบทความ (เว้นบรรทัดว่างเพื่อขึ้นย่อหน้าใหม่)</label>
            <textarea value={artContent} onChange={e => setArtContent(e.target.value)} rows="10" placeholder="เขียนเนื้อหาบทความที่นี่..." />
          </div>
          <div className="ref-actions">
            <button type="submit" className="btn-primary">{editingArtId ? '💾 บันทึก' : '➕ เผยแพร่บทความ'}</button>
            {editingArtId && <button type="button" className="btn-secondary" onClick={cancelEditArticle}>ยกเลิก</button>}
          </div>
        </form>

        <table className="admin-table" style={{ marginTop: '1.5rem' }}>
          <thead>
            <tr><th>ปก</th><th>หัวข้อ</th><th>หมวด</th><th>แสดง</th><th>จัดการ</th></tr>
          </thead>
          <tbody>
            {articles.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', color: '#888' }}>ยังไม่มีบทความ</td></tr>}
            {articles.map(a => (
              <tr key={a.id}>
                <td>{a.cover ? <img src={a.cover} alt={a.title} style={{ width: 70, height: 46, objectFit: 'cover', borderRadius: 4 }} /> : '—'}</td>
                <td style={{ maxWidth: 280 }}>{a.title}</td>
                <td>{a.category}</td>
                <td><ToggleSwitch checked={isShown(a)} onChange={() => handleToggleArticleVisible(a)} /></td>
                <td style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn-edit" onClick={() => handleEditArticle(a)}>แก้ไข</button>
                  <button className="btn-delete" onClick={() => handleDeleteArticle(a.id)}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ─── Hero Background (Image or Video) ─── */}
      <section className="admin-section" style={{ display: activeTab === 'hero' ? 'block' : 'none' }}>
        <h2>🎬 ข้อความ Hero (หัวข้อหลักหน้าแรก)</h2>
        <div style={{ border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '1.5rem', maxWidth: 640, marginBottom: '2rem' }}>
          <div className="ref-field" style={{ marginBottom: '1rem' }}>
            <label>Hero Title (หัวข้อใหญ่ — H1 มีผลต่อ SEO)</label>
            <textarea value={heroTitle} onChange={e => setHeroTitle(e.target.value)} rows="2"
              placeholder="เช่น BSBuildTh รับเหมาต่อเติม–รีโนเวทบ้านครบวงจร ย่านเพชรเกษม-บางแค" />
          </div>
          <div className="ref-field" style={{ marginBottom: '1rem' }}>
            <label>Hero Subtitle (คำโปรยใต้หัวข้อ)</label>
            <textarea value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} rows="2"
              placeholder="เช่น ต่อเติม · รีโนเวท · ตกแต่งภายใน — ประสบการณ์กว่า 30 ปี รับประกันงาน 1 ปี" />
          </div>
          <button className="btn btn-solid" onClick={handleSaveHeroText} disabled={savingHeroText}>
            {savingHeroText ? '⏳ กำลังบันทึก...' : '💾 บันทึกข้อความ Hero'}
          </button>
        </div>

        <h2>🖼️ Hero Background (รูป / วิดีโอ)</h2>
        <p style={{ color: '#888', marginBottom: '1rem', fontSize: '0.9rem' }}>
          พื้นหลังของส่วน Hero — รองรับทั้ง <strong>รูปภาพ</strong> และ <strong>วิดีโอเต็มเฟรม</strong>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#fff8e1', borderLeft: '4px solid #f59e0b', borderRadius: 6, padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#5c4400' }}>
            <strong>📐 ถ้าใช้รูปภาพ:</strong><br/>
            • ขนาด: <strong>1920 × 1080 px</strong> (16:9)<br/>
            • น้ำหนัก: ≤ 500 KB (<a href="https://tinypng.com" target="_blank" rel="noreferrer" style={{ color: '#c9740a' }}>tinypng.com</a>)<br/>
            • Format: JPG / WebP<br/>
            • เนื้อหา: <strong>ไม่มีคน</strong>
          </div>
          <div style={{ background: '#e8f0ff', borderLeft: '4px solid #4a6fa5', borderRadius: 6, padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#1e3a5f' }}>
            <strong>🎬 ถ้าใช้วิดีโอ:</strong><br/>
            • ขนาด: <strong>1920×1080</strong> หรือ 1280×720<br/>
            • ความยาว: 8-15 วินาที (loop)<br/>
            • น้ำหนัก: ≤ 10 MB (แนะนำ ≤ 5 MB)<br/>
            • Format: <strong>MP4 (H.264)</strong> หรือ WebM<br/>
            • วิดีโอจะเล่นวน เงียบเสมอ — โหลดฟรีที่ <a href="https://www.pexels.com/videos/" target="_blank" rel="noreferrer" style={{ color: '#4a6fa5' }}>Pexels Videos</a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Current preview */}
          <div>
            <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 0.4rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>ปัจจุบัน:</span>
              <span style={{
                background: heroBgImage?.media_type === 'video' ? '#4a6fa5' : '#f59e0b',
                color: '#fff', padding: '0.1rem 0.5rem', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600
              }}>
                {heroBgImage?.media_type === 'video' ? '🎬 VIDEO' : '🖼️ IMAGE'}
              </span>
            </p>
            {heroBgImage?.image_path ? (
              heroBgImage.media_type === 'video' ? (
                <video
                  src={`${API}${heroBgImage.image_path}`}
                  autoPlay loop muted playsInline
                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd', background: '#000' }}
                />
              ) : (
                <img
                  src={`${API}${heroBgImage.image_path}`}
                  alt="Hero Background"
                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }}
                />
              )
            ) : (
              <div style={{ width: '100%', aspectRatio: '16/9', background: '#f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                ยังไม่มีไฟล์
              </div>
            )}
          </div>

          {/* Upload form */}
          <div>
            <label style={{ fontSize: '0.85rem', color: '#444', fontWeight: 600 }}>เลือกไฟล์ใหม่ (รูป หรือ วิดีโอ)</label>
            <input
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              onChange={e => setHeroBgFile(e.target.files[0])}
              style={{ display: 'block', marginTop: '0.4rem', marginBottom: '0.75rem' }}
            />
            {heroBgFile && (
              <div key="hero-bg-preview" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '0.6rem 0.85rem', marginBottom: '0.85rem', fontSize: '0.85rem' }}>
                <span style={{
                  background: heroBgFile.type.startsWith('video/') ? '#4a6fa5' : '#f59e0b',
                  color: '#fff', padding: '0.1rem 0.5rem', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600, marginRight: '0.5rem'
                }}>
                  {heroBgFile.type.startsWith('video/') ? '🎬 VIDEO' : '🖼️ IMAGE'}
                </span>
                <strong>{heroBgFile.name}</strong>
                <span style={{ color: '#666' }}> ({(heroBgFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                {heroBgFile.size > 10 * 1024 * 1024 && (
                  <p style={{ color: '#c00', margin: '0.3rem 0 0', fontSize: '0.78rem' }}>
                    ⚠️ ไฟล์ใหญ่กว่า 10 MB อาจโหลดช้า — แนะนำบีบอัดก่อน
                  </p>
                )}
              </div>
            )}
            <button
              onClick={handleUploadHeroBg}
              disabled={!heroBgFile || heroBgUploading}
              className="btn-primary"
              style={{ opacity: (!heroBgFile || heroBgUploading) ? 0.5 : 1 }}
            >
              {heroBgUploading ? '⏳ กำลังอัปโหลด...' : '💾 อัปเดตพื้นหลัง'}
            </button>
          </div>
        </div>
      </section>

      {/* ─── Notification Settings ─── */}
      <section className="admin-section" style={{ display: activeTab === 'notifications' ? 'block' : 'none' }}>
        <h2>🔔 Notification Settings</h2>
        <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          แจ้งเตือนผ่าน Email + LINE + Messenger เมื่อมีลูกค้ากรอกฟอร์มขอใบเสนอราคา — ทำงาน 24 ชม. ไม่ต้องเปิดคอม
        </p>

        <div style={{ background: '#fff8e1', border: '1.5px solid #ffd54f', borderRadius: 10, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 0.75rem', fontWeight: 600, color: '#7a5c00' }}>🔐 ตั้งค่า Token ที่ Google Apps Script (ไม่ใช่ที่นี่)</p>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#555' }}>
            Token ของ LINE/Messenger เป็นความลับ จึงเก็บไว้ฝั่งเซิร์ฟเวอร์ (Apps Script) เพื่อความปลอดภัย —
            ไม่เก็บในหน้าเว็บที่เปิดสาธารณะ
          </p>
          <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#444' }}>
            <li>เปิด <a href="https://script.google.com" target="_blank" rel="noreferrer" style={{ color: '#4a6fa5' }}>script.google.com</a> → โปรเจกต์เดิม (ตัวที่ส่ง email อยู่)</li>
            <li>วางโค้ดจากไฟล์ <code>apps-script/Code.gs</code> ในโปรเจกต์ แล้วกรอก CONFIG ด้านบนสุด</li>
            <li>ทดสอบด้วยฟังก์ชัน <code>runTest</code> → Deploy เวอร์ชันใหม่</li>
          </ol>
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: '#777' }}>
            📄 รายละเอียดทั้งหมดอยู่ใน <code>apps-script/README.md</code>
          </p>
        </div>

        {/* Per-channel enable/disable (controls which channels actually send) */}
        <div style={{ border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '1.5rem', maxWidth: 480 }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>เปิด/ปิดช่องทางแจ้งเตือน</h3>
          <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#888' }}>
            ปิดช่องไหน ระบบจะไม่ส่งแจ้งเตือนช่องนั้นเมื่อมีลูกค้ากรอกฟอร์ม (token ยังอยู่ครบ ไม่ต้องกรอกใหม่)
          </p>
          {[
            { key: 'notif_email', label: '📧 Email' },
            { key: 'notif_line', label: '💬 LINE' },
            { key: 'notif_messenger', label: '📘 Messenger' },
          ].map(c => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: '0.95rem' }}>{c.label}</span>
              <ToggleSwitch
                checked={websiteSettings[c.key] !== false}
                onChange={checked => setWebsiteSettings({ ...websiteSettings, [c.key]: checked })}
              />
            </div>
          ))}
          <button className="btn btn-solid" style={{ marginTop: '1.25rem' }} onClick={handleSaveNotifEnable}>
            💾 บันทึกการตั้งค่าแจ้งเตือน
          </button>
        </div>

        <div style={{ display: 'none' }}>

          {/* EMAIL */}
          <div style={{ border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '1.25rem', background: notifSettings.email?.enabled ? '#f0fff4' : '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📧</span>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Email (Gmail)</h3>
              <ToggleSwitch
                checked={!!notifSettings.email?.enabled}
                onChange={checked => setNotifSettings(prev => ({ ...prev, email: { ...prev.email, enabled: checked } }))}
                label="เปิดใช้งาน"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={{ fontSize: '0.8rem', color: '#555' }}>Gmail Account (ผู้ส่ง)</label>
                <input value={notifSettings.email?.config?.email_user || ''} onChange={e => updateNotifConfig('email', 'email_user', e.target.value)} placeholder="yourname@gmail.com" /></div>
              <div><label style={{ fontSize: '0.8rem', color: '#555' }}>App Password <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#4a6fa5', fontSize: '0.75rem' }}>วิธีรับ?</a></label>
                <input type="password" value={notifSettings.email?.config?.email_password || ''} onChange={e => updateNotifConfig('email', 'email_password', e.target.value)} placeholder="xxxx xxxx xxxx xxxx" /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: '0.8rem', color: '#555' }}>ส่งแจ้งเตือนไปที่ Email (ปล่อยว่าง = ใช้ Gmail Account ด้านบน)</label>
                <input value={notifSettings.email?.config?.notify_to || ''} onChange={e => updateNotifConfig('email', 'notify_to', e.target.value)} placeholder="admin@yourdomain.com" /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
              <button className="btn-primary" onClick={() => handleSaveNotif('email')}>💾 บันทึก</button>
              <button className="btn-secondary" onClick={() => handleTestNotif('email')} disabled={notifTesting.email}>
                {notifTesting.email ? '⏳ กำลังส่ง...' : '📤 ทดสอบ'}
              </button>
              <div style={{ minHeight: '1.2rem', display: 'flex', alignItems: 'center' }}>
                {notifTestResult.email && (
                  <span style={{ fontSize: '0.85rem', color: notifTestResult.email.ok ? 'green' : 'red' }}>
                    {notifTestResult.email.ok ? '✅ ส่งสำเร็จ!' : `❌ ${notifTestResult.email.error}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* LINE */}
          <div style={{ border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '1.25rem', background: notifSettings.line?.enabled ? '#f0fff4' : '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.4rem' }}>💬</span>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>LINE Official Account</h3>
              <ToggleSwitch
                checked={!!notifSettings.line?.enabled}
                onChange={checked => setNotifSettings(prev => ({ ...prev, line: { ...prev.line, enabled: checked } }))}
                label="เปิดใช้งาน"
              />
            </div>
            <div style={{ background: '#e8f4fd', borderRadius: 6, padding: '0.6rem 0.85rem', fontSize: '0.8rem', color: '#444', marginBottom: '0.85rem' }}>
              📌 <strong>วิธีรับค่า:</strong> ไปที่ <a href="https://developers.line.biz/console/" target="_blank" rel="noreferrer" style={{ color: '#06c755' }}>LINE Developers Console</a> → เลือก Channel → Messaging API → Channel Access Token (Long-lived) | Admin User ID: ส่งข้อความหา Bot แล้วดูใน webhook log
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={{ fontSize: '0.8rem', color: '#555' }}>Channel Access Token</label>
                <input type="password" value={notifSettings.line?.config?.channel_access_token || ''} onChange={e => updateNotifConfig('line', 'channel_access_token', e.target.value)} placeholder="Long-lived token..." /></div>
              <div><label style={{ fontSize: '0.8rem', color: '#555' }}>Admin User ID (LINE)</label>
                <input value={notifSettings.line?.config?.admin_user_id || ''} onChange={e => updateNotifConfig('line', 'admin_user_id', e.target.value)} placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
              <button className="btn-primary" onClick={() => handleSaveNotif('line')}>💾 บันทึก</button>
              <button className="btn-secondary" onClick={() => handleTestNotif('line')} disabled={notifTesting.line}>
                {notifTesting.line ? '⏳ กำลังส่ง...' : '📤 ทดสอบ'}
              </button>
              <div style={{ minHeight: '1.2rem', display: 'flex', alignItems: 'center' }}>
                {notifTestResult.line && (
                  <span style={{ fontSize: '0.85rem', color: notifTestResult.line.ok ? 'green' : 'red' }}>
                    {notifTestResult.line.ok ? '✅ ส่งสำเร็จ!' : `❌ ${notifTestResult.line.error}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* FACEBOOK */}
          <div style={{ border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '1.25rem', background: notifSettings.facebook?.enabled ? '#f0fff4' : '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📘</span>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Facebook Messenger</h3>
              <ToggleSwitch
                checked={!!notifSettings.facebook?.enabled}
                onChange={checked => setNotifSettings(prev => ({ ...prev, facebook: { ...prev.facebook, enabled: checked } }))}
                label="เปิดใช้งาน"
              />
            </div>
            <div style={{ background: '#e8f0fe', borderRadius: 6, padding: '0.6rem 0.85rem', fontSize: '0.8rem', color: '#444', marginBottom: '0.85rem' }}>
              📌 <strong>วิธีรับค่า:</strong> ไปที่ <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" style={{ color: '#1877f2' }}>Facebook Developers</a> → สร้าง App → Messenger → Page Access Token | Admin PSID: ส่งข้อความหา Page แล้วดู PSID จาก webhook
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={{ fontSize: '0.8rem', color: '#555' }}>Page Access Token</label>
                <input type="password" value={notifSettings.facebook?.config?.page_access_token || ''} onChange={e => updateNotifConfig('facebook', 'page_access_token', e.target.value)} placeholder="EAAxxxxxxx..." /></div>
              <div><label style={{ fontSize: '0.8rem', color: '#555' }}>Admin PSID (Messenger ID)</label>
                <input value={notifSettings.facebook?.config?.admin_psid || ''} onChange={e => updateNotifConfig('facebook', 'admin_psid', e.target.value)} placeholder="1234567890..." /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
              <button className="btn-primary" onClick={() => handleSaveNotif('facebook')}>💾 บันทึก</button>
              <button className="btn-secondary" onClick={() => handleTestNotif('facebook')} disabled={notifTesting.facebook}>
                {notifTesting.facebook ? '⏳ กำลังส่ง...' : '📤 ทดสอบ'}
              </button>
              <div style={{ minHeight: '1.2rem', display: 'flex', alignItems: 'center' }}>
                {notifTestResult.facebook && (
                  <span style={{ fontSize: '0.85rem', color: notifTestResult.facebook.ok ? 'green' : 'red' }}>
                    {notifTestResult.facebook.ok ? '✅ ส่งสำเร็จ!' : `❌ ${notifTestResult.facebook.error}`}
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="admin-section" style={{ display: activeTab === 'reviews' ? 'block' : 'none' }}>
        <h2>Manage Client Reviews</h2>

        <form className="admin-form" onSubmit={handleAddReview}>
          <input
            type="text"
            placeholder="Customer Name"
            value={reviewName}
            onChange={e => setReviewName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Role/Title (e.g. Home Owner)"
            value={reviewRole}
            onChange={e => setReviewRole(e.target.value)}
            required
          />
          <textarea
            placeholder="Review Text"
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            required
            rows="4"
            style={{ fontFamily: 'inherit', padding: '0.5rem' }}
          />
          <select
            value={reviewStars}
            onChange={e => setReviewStars(e.target.value)}
            style={{ padding: '0.75rem' }}
          >
            <option value="1">1 Star</option>
            <option value="2">2 Stars</option>
            <option value="3">3 Stars</option>
            <option value="4">4 Stars</option>
            <option value="5">5 Stars</option>
          </select>
          <ToggleSwitch
            checked={reviewVisible}
            onChange={checked => setReviewVisible(checked)}
            label="Visible on website"
          />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-solid">
              {editingReviewId ? 'Update Review' : 'Add Review'}
            </button>
            {editingReviewId && (
              <button type="button" onClick={handleCancelReviewEdit} className="btn btn-outline">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Text</th>
                <th>Stars</th>
                <th>Visible</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.name}</td>
                  <td>{r.role}</td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.text}</td>
                  <td>{'★'.repeat(r.stars)}</td>
                  <td><ToggleSwitch checked={r.is_visible === 1} onChange={() => handleToggleReviewVisible(r)} /></td>
                  <td>
                    <button onClick={() => handleEditReview(r)} className="btn-edit" style={{ marginRight: '0.5rem' }}>Edit</button>
                    <button onClick={() => handleDeleteReview(r.id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section" style={{ display: activeTab === 'inbox' ? 'block' : 'none' }}>
        <h2>Customer Inquiries (Inbox)</h2>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Contact (Line/Phone)</th>
                <th>Email</th>
                <th>Message</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id}>
                  <td>{new Date(c.created_at).toLocaleString()}</td>
                  <td>{c.name}</td>
                  <td>{c.contact_info}</td>
                  <td>{c.email || '-'}</td>
                  <td style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.message || '-'}</td>
                  <td style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => handleEditContact(c)} className="btn-edit" style={{ fontSize: '0.8rem' }}>✏️ แก้ไข</button>
                    <button onClick={() => handleDeleteContact(c.id)} className="btn-delete" style={{ fontSize: '0.8rem' }}>🗑️ ลบ</button>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign:'center' }}>No inquiries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {editingContactId && (
          <div key={`contact-editor-${editingContactId}`} style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#f5f5f5', borderRadius: 8, maxWidth: 560 }}>
            <h3 style={{ marginTop: 0 }}>แก้ไขข้อความลูกค้า</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div><label style={{ fontSize: '0.82rem', color: '#444', fontWeight: 600 }}>ชื่อ</label>
                <input value={contactEdit.name} onChange={e => setContactEdit({ ...contactEdit, name: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #d8d8d8' }} /></div>
              <div><label style={{ fontSize: '0.82rem', color: '#444', fontWeight: 600 }}>ติดต่อ (Line/เบอร์)</label>
                <input value={contactEdit.contact_info} onChange={e => setContactEdit({ ...contactEdit, contact_info: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #d8d8d8' }} /></div>
              <div><label style={{ fontSize: '0.82rem', color: '#444', fontWeight: 600 }}>Email</label>
                <input value={contactEdit.email} onChange={e => setContactEdit({ ...contactEdit, email: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #d8d8d8' }} /></div>
              <div><label style={{ fontSize: '0.82rem', color: '#444', fontWeight: 600 }}>ข้อความ</label>
                <textarea rows="3" value={contactEdit.message} onChange={e => setContactEdit({ ...contactEdit, message: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #d8d8d8', fontFamily: 'inherit' }} /></div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem' }}>
              <button onClick={handleUpdateContact} className="btn btn-solid">บันทึก</button>
              <button onClick={() => setEditingContactId(null)} className="btn btn-outline">ยกเลิก</button>
            </div>
          </div>
        )}
      </section>

      <section className="admin-section" style={{ display: activeTab === 'content' ? 'block' : 'none' }}>
        <h2>Manage Website Content (Thai Text)</h2>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Key</th>
                <th>Content</th>
                <th>แสดง</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {websiteContent.map(content => (
                <tr key={content.id}>
                  <td>{content.section_name}</td>
                  <td>{content.section_key}</td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{content.thai_content}</td>
                  <td><ToggleSwitch checked={isShown(content)} onChange={() => handleToggleContentVisible(content)} /></td>
                  <td>
                    <button onClick={() => handleEditContent(content)} className="btn-edit">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingContentId && (
          <div key={`content-editor-${editingContentId}`} style={{ marginTop: '2rem', padding: '1.5rem', background: '#f5f5f5', borderRadius: '8px' }}>
            <h3>Editing: {contentName}</h3>
            <textarea
              style={{ width: '100%', padding: '1rem', minHeight: '150px', fontFamily: 'inherit' }}
              value={contentValue}
              onChange={e => setContentValue(e.target.value)}
              placeholder="Enter Thai content..."
            />
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
              <button onClick={() => handleUpdateContent(editingContentId)} className="btn btn-solid">Save Content</button>
              <button onClick={handleCancelContentEdit} className="btn btn-outline">Cancel</button>
            </div>
          </div>
        )}
      </section>

      <section className="admin-section" style={{ display: activeTab === 'services' ? 'block' : 'none' }}>
        <h2>Manage Services</h2>

        <form className="admin-form" onSubmit={handleSaveService}>
          <input
            type="text"
            placeholder="Icon (e.g., 🎨)"
            value={serviceIcon}
            onChange={e => setServiceIcon(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Title (Thai)"
            value={serviceTitleThai}
            onChange={e => setServiceTitleThai(e.target.value)}
            required
          />
          <textarea
            placeholder="Description (Thai)"
            value={serviceDescThai}
            onChange={e => setServiceDescThai(e.target.value)}
            required
            rows="3"
            style={{ fontFamily: 'inherit', padding: '0.5rem' }}
          />
          <input
            type="number"
            placeholder="Sort Order"
            value={serviceSortOrder}
            onChange={e => setServiceSortOrder(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-solid">
              {editingServiceId ? 'Update Service' : 'Add Service'}
            </button>
            {editingServiceId && (
              <button type="button" onClick={handleCancelServiceEdit} className="btn btn-outline">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Title (Thai)</th>
                <th>Description</th>
                <th>Sort Order</th>
                <th>แสดง</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {dbServices.map(s => (
                <tr key={s.id}>
                  <td style={{ fontSize: '1.5rem' }}>{s.icon}</td>
                  <td>{s.title_thai}</td>
                  <td style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.description_thai}</td>
                  <td>{s.sort_order}</td>
                  <td><ToggleSwitch checked={isShown(s)} onChange={() => handleToggleServiceVisible(s)} /></td>
                  <td>
                    <button onClick={() => handleEditService(s)} className="btn-edit" style={{ marginRight: '0.5rem' }}>Edit</button>
                    <button onClick={() => handleDeleteService(s.id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section" style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
        <h2>Website Settings</h2>
        <form className="admin-form ws-form" onSubmit={handleSaveSettings}>
          <div className="ws-card">
            <h3 className="ws-card-title">📊 สถิติ "เกี่ยวกับเรา"</h3>
            <div className="ws-grid-3">
              <div className="ref-field">
                <label>ผลงานทั้งหมด (เช่น 500+)</label>
                <input type="text" value={websiteSettings.projects_count || ''} onChange={e => setWebsiteSettings({ ...websiteSettings, projects_count: e.target.value })} />
              </div>
              <div className="ref-field">
                <label>จำนวนทีมงาน (เช่น 30+)</label>
                <input type="text" value={websiteSettings.team_count || ''} onChange={e => setWebsiteSettings({ ...websiteSettings, team_count: e.target.value })} />
              </div>
              <div className="ref-field">
                <label>ความพึงพอใจ (เช่น 95%)</label>
                <input type="text" value={websiteSettings.satisfaction_percent || ''} onChange={e => setWebsiteSettings({ ...websiteSettings, satisfaction_percent: e.target.value })} />
              </div>
            </div>
            <div className="ws-toggle-row" style={{ borderBottom: 'none', marginTop: '0.5rem' }}>
              <span>แสดงแถบสถิติในส่วน "เกี่ยวกับเรา"</span>
              <ToggleSwitch checked={websiteSettings.show_about_stats !== false} onChange={checked => setWebsiteSettings({ ...websiteSettings, show_about_stats: checked })} />
            </div>
          </div>

          <div className="ws-card">
            <h3 className="ws-card-title">🧩 เปิด/ปิดแต่ละส่วนของหน้าเว็บ</h3>
            <div className="ws-toggle-grid">
              {[
                { key: 'show_hero', label: 'Hero (แบนเนอร์บนสุด)' },
                { key: 'show_beforeafter', label: 'Before / After (ก่อน-หลัง)' },
                { key: 'show_projects', label: 'ผลงานที่ผ่านมา' },
                { key: 'show_reference', label: 'รูปอ้างอิง (Reference)' },
                { key: 'show_calculator', label: 'ประเมินงบเบื้องต้น' },
                { key: 'show_about', label: 'เกี่ยวกับเรา (About Us)' },
                { key: 'show_services', label: 'บริการ (Services)' },
                { key: 'show_reviews', label: 'รีวิวลูกค้า' },
                { key: 'show_blog', label: 'บทความ (Blog teaser)' },
                { key: 'show_process', label: 'ขั้นตอนการทำงาน' },
              ].map(s => (
                <div className="ws-toggle-row" key={s.key}>
                  <span>{s.label}</span>
                  <ToggleSwitch checked={websiteSettings[s.key] !== false} onChange={checked => setWebsiteSettings({ ...websiteSettings, [s.key]: checked })} />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-solid">💾 บันทึกการตั้งค่า</button>
        </form>
      </section>
    </div>
  );
};

export default Admin;


