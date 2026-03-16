import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import "../styles/LibrarianDashboard.css";

const RegisterBook = ({ onStatsUpdate }) => {
    const [formData, setFormData] = useState({
        title: "",
        author: "",
        isbn: "",
        category: "Fiction",
        publisher: "",
        publication_year: new Date().getFullYear(),
        total_copies: 1,
        location: "",
        description: "",
    });

    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const categories = [
        "Fiction",
        "Non-Fiction",
        "Science",
        "Technology",
        "History",
        "Biography",
        "Mystery",
        "Romance",
        "Self-Help",
        "Reference",
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "total_copies" || name === "publication_year" ? parseInt(value) || "" : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = sessionStorage.getItem("authToken");
            const response = await axios.post(
                `${API_BASE_URL}/api/library/books`,
                {
                    ...formData,
                    available_copies: formData.total_copies,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setSnackbar({
                open: true,
                message: "✓ Book registered successfully!",
                severity: "success",
            });

            // Reset form
            setFormData({
                title: "",
                author: "",
                isbn: "",
                category: "Fiction",
                publisher: "",
                publication_year: new Date().getFullYear(),
                total_copies: 1,
                location: "",
                description: "",
            });

            onStatsUpdate?.();
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.response?.data?.error || "Error registering book",
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const closeSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <div style={{
                background: "white",
                padding: "32px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}>
                <h2 style={{
                    fontSize: "24px",
                    fontWeight: "600",
                    marginBottom: "24px",
                    color: "#1e293b",
                }}>
                    Register New Book
                </h2>

                <form onSubmit={handleSubmit}>
                    {/* Title and Author */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "500",
                                marginBottom: "8px",
                                color: "#475569",
                            }}>
                                Book Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="e.g., The Great Gatsby"
                                required
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontFamily: "inherit",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "500",
                                marginBottom: "8px",
                                color: "#475569",
                            }}>
                                Author *
                            </label>
                            <input
                                type="text"
                                name="author"
                                value={formData.author}
                                onChange={handleInputChange}
                                placeholder="e.g., F. Scott Fitzgerald"
                                required
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontFamily: "inherit",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                    </div>

                    {/* ISBN and Category */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "500",
                                marginBottom: "8px",
                                color: "#475569",
                            }}>
                                ISBN *
                            </label>
                            <input
                                type="text"
                                name="isbn"
                                value={formData.isbn}
                                onChange={handleInputChange}
                                placeholder="e.g., 978-0743273565"
                                required
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontFamily: "inherit",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "500",
                                marginBottom: "8px",
                                color: "#475569",
                            }}>
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                required
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontFamily: "inherit",
                                    boxSizing: "border-box",
                                }}
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Publisher and Year */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "500",
                                marginBottom: "8px",
                                color: "#475569",
                            }}>
                                Publisher *
                            </label>
                            <input
                                type="text"
                                name="publisher"
                                value={formData.publisher}
                                onChange={handleInputChange}
                                placeholder="e.g., Scribner"
                                required
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontFamily: "inherit",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "500",
                                marginBottom: "8px",
                                color: "#475569",
                            }}>
                                Publication Year *
                            </label>
                            <input
                                type="number"
                                name="publication_year"
                                value={formData.publication_year}
                                onChange={handleInputChange}
                                min="1900"
                                max={new Date().getFullYear()}
                                required
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontFamily: "inherit",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                    </div>

                    {/* Copies and Location */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "500",
                                marginBottom: "8px",
                                color: "#475569",
                            }}>
                                Total Copies *
                            </label>
                            <input
                                type="number"
                                name="total_copies"
                                value={formData.total_copies}
                                onChange={handleInputChange}
                                min="1"
                                required
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontFamily: "inherit",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                        <div>
                            <label style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "500",
                                marginBottom: "8px",
                                color: "#475569",
                            }}>
                                Shelf Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                placeholder="e.g., A2-45"
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontFamily: "inherit",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            marginBottom: "8px",
                            color: "#475569",
                        }}>
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Brief description of the book..."
                            rows="3"
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                fontSize: "14px",
                                fontFamily: "inherit",
                                boxSizing: "border-box",
                                resize: "vertical",
                            }}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "12px 16px",
                            backgroundColor: loading ? "#cbd5e1" : "#2D7FF9",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "all 0.3s ease",
                        }}
                    >
                        {loading ? "Registering..." : "Register Book"}
                    </button>
                </form>
            </div>

            {/* Snackbar */}
            {snackbar.open && (
                <div
                    style={{
                        position: "fixed",
                        bottom: "20px",
                        right: "20px",
                        padding: "16px 20px",
                        borderRadius: "6px",
                        backgroundColor: snackbar.severity === "success" ? "#10b981" : "#FF5A5F",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: "500",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        animation: "slideIn 0.3s ease-out",
                        maxWidth: "90vw",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                        {snackbar.message}
                        <button
                            onClick={closeSnackbar}
                            style={{
                                background: "none",
                                border: "none",
                                color: "white",
                                cursor: "pointer",
                                fontSize: "18px",
                                padding: "0",
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterBook;
