import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const BookForm = ({
    isOpen,
    onClose,
    onSubmit,
    loading,
    editingBook = null,
}) => {
    const categories = [
        'Fiction',
        'Non-Fiction',
        'Science',
        'Technology',
        'History',
        'Biography',
        'Mathematics',
        'Physics',
        'Chemistry',
        'Computer Science',
        'Programming',
        'Business',
        'Self-Help',
        'Reference'
    ];

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        category: '',
        publisher: '',
        publication_year: new Date().getFullYear(),
        total_copies: 1,
        location: '',
        description: '',
    });

    useEffect(() => {
        if (editingBook) {
            setFormData({
                title: editingBook.title || '',
                author: editingBook.author || '',
                isbn: editingBook.isbn || '',
                category: editingBook.category || '',
                publisher: editingBook.publisher || '',
                publication_year: editingBook.publication_year || new Date().getFullYear(),
                total_copies: editingBook.total_copies || 1,
                location: editingBook.location || '',
                description: editingBook.description || '',
            });
        } else {
            setFormData({
                title: '',
                author: '',
                isbn: '',
                category: '',
                publisher: '',
                publication_year: new Date().getFullYear(),
                total_copies: 1,
                location: '',
                description: '',
            });
        }
    }, [editingBook, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['publication_year', 'total_copies'].includes(name) ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData, editingBook?._id);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '24px',
                    borderBottom: '1px solid #e2e8f0',
                }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                        {editingBook ? 'Edit Book' : 'Register New Book'}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: '4px',
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    <div className="book-form">
                        <div className="form-group">
                            <label className="form-group__label">Book Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="form-group__input"
                                placeholder="e.g., The Great Gatsby"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-group__label">Author Name *</label>
                            <input
                                type="text"
                                name="author"
                                value={formData.author}
                                onChange={handleInputChange}
                                className="form-group__input"
                                placeholder="e.g., F. Scott Fitzgerald"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-group__label">ISBN Number *</label>
                            <input
                                type="text"
                                name="isbn"
                                value={formData.isbn}
                                onChange={handleInputChange}
                                className="form-group__input"
                                placeholder="e.g., 978-0-7475-3269-9"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-group__label">Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="form-group__select"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-group__label">Publisher *</label>
                            <input
                                type="text"
                                name="publisher"
                                value={formData.publisher}
                                onChange={handleInputChange}
                                className="form-group__input"
                                placeholder="e.g., Charles Scribner's Sons"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-group__label">Publication Year *</label>
                            <input
                                type="number"
                                name="publication_year"
                                value={formData.publication_year}
                                onChange={handleInputChange}
                                className="form-group__input"
                                min="1900"
                                max={new Date().getFullYear()}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-group__label">Total Copies *</label>
                            <input
                                type="number"
                                name="total_copies"
                                value={formData.total_copies}
                                onChange={handleInputChange}
                                className="form-group__input"
                                min="1"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-group__label">Rack Number</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className="form-group__input"
                                placeholder="e.g., B-12-04"
                            />
                        </div>

                        <div className="form-group form-group__full">
                            <label className="form-group__label">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="form-group__textarea"
                                placeholder="Enter a brief description of the book..."
                            />
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn--secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn--primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (editingBook ? 'Update Book' : 'Save Book')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookForm;
