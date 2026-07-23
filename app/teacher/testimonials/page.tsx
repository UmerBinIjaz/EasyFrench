"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Edit, Trash2, Star, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/providers/ToastProvider";
interface Testimonial {
    id: string;
    name: string;
    role: string;
    text: string;
    avatar: string | null;
    rating: number;
    color: string | null;
    approved: boolean;
    featured: boolean;
    createdAt: string;
    updatedAt: string;
}

const isAvatarImage = (avatar: string | null) => {
    if (!avatar) return false;

    return avatar.startsWith("/") || /^https?:\/\//i.test(avatar) || /^data:image\//i.test(avatar);
};

const getAvatarFallback = (testimonial: Testimonial) => {
    return testimonial.avatar && !isAvatarImage(testimonial.avatar)
        ? testimonial.avatar
        : testimonial.name.substring(0, 2).toUpperCase();
};

/**
 * Avatar color palette sourced from the EasyFrench design system
 * (see app/globals.css). Keeping the picker limited to these colors
 * ensures testimonial avatars always match the frontend palette.
 */
const AVATAR_COLOR_PALETTE = [
    { name: "Navy 800", value: "#1a237e" },
    { name: "Navy 700", value: "#283593" },
    { name: "Navy 600", value: "#3949ab" },
    { name: "Navy 500", value: "#3f51b5" },
    { name: "Green 600", value: "#2e7d32" },
    { name: "Green 500", value: "#388e3c" },
    { name: "Amber", value: "#f9a825" },
    { name: "Orange", value: "#e65100" },
    { name: "Purple", value: "#6a1b9a" },
    { name: "Teal", value: "#00695c" },
    { name: "Red", value: "#c62828" },
    { name: "Navy 900", value: "#0d1b4b" },
] as const;

const DEFAULT_AVATAR_COLOR = "#1a237e";

export default function TestimonialsPage() {
    const { showToast } = useToast()
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        role: "",
        text: "",
        avatar: "",
        rating: 5,
        color: DEFAULT_AVATAR_COLOR,
        approved: true,
        featured: false,
    });
    const [filter, setFilter] = useState<"all" | "approved" | "pending" | "featured">("all");

    // Fetch all testimonials for teacher management, including pending ones.
    const fetchTestimonials = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const response = await fetch("/api/testimonials?all=true", {
                cache: "no-store",
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                setTestimonials(data);
            } else {
                showToast("Failed to fetch testimonials");
            }
        } catch (error) {
            console.error("Error fetching testimonials:", error);
            showToast("Error fetching testimonials");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        void fetchTestimonials(false);
    }, [fetchTestimonials]);

    // Filter testimonials
    const filteredTestimonials = testimonials.filter((testimonial) => {
        if (filter === "approved") return testimonial.approved;
        if (filter === "pending") return !testimonial.approved;
        if (filter === "featured") return testimonial.featured;
        return true;
    });

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? parseInt(value, 10) : value,
        }));
    };

    // Handle checkbox changes
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: "",
            role: "",
            text: "",
            avatar: "",
            rating: 5,
            color: DEFAULT_AVATAR_COLOR,
            approved: true,
            featured: false,
        });
        setEditingTestimonial(null);
    };

    // Open modal for creating new testimonial
    const handleCreate = () => {
        resetForm();
        setShowModal(true);
    };

    // Open modal for editing testimonial
    const handleEdit = (testimonial: Testimonial) => {
        setEditingTestimonial(testimonial);
        setFormData({
            name: testimonial.name,
            role: testimonial.role,
            text: testimonial.text,
            avatar: testimonial.avatar || "",
            rating: testimonial.rating,
            color: testimonial.color || DEFAULT_AVATAR_COLOR,
            approved: testimonial.approved,
            featured: testimonial.featured,
        });
        setShowModal(true);
    };

    // Save testimonial (create or update)
    const handleSave = async () => {
        try {
            const url = editingTestimonial
                ? `/api/testimonials/${editingTestimonial.id}`
                : "/api/testimonials";
            const method = editingTestimonial ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const savedTestimonial = await response.json();
                showToast(
                    editingTestimonial
                        ? "Testimonial updated successfully"
                        : "Testimonial created successfully",
                    "success"
                );
                setTestimonials((prev) => {
                    if (editingTestimonial) {
                        return prev.map((testimonial) =>
                            testimonial.id === savedTestimonial.id ? savedTestimonial : testimonial
                        );
                    }

                    return [savedTestimonial, ...prev.filter((testimonial) => testimonial.id !== savedTestimonial.id)];
                });
                setShowModal(false);
                resetForm();
                void fetchTestimonials(false);
            } else {
                const error = await response.json();
                showToast(error.error || "Failed to save testimonial");
            }
        } catch (error) {
            console.error("Error saving testimonial:", error);
            showToast("Error saving testimonial");
        }
    };

    // Delete testimonial
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this testimonial?")) return;

        try {
            const response = await fetch(`/api/testimonials/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                showToast("Testimonial deleted successfully", "success");
                fetchTestimonials();
            } else {
                const error = await response.json();
                showToast(error.error || "Failed to delete testimonial");
            }
        } catch (error) {
            console.error("Error deleting testimonial:", error);
            showToast("Error deleting testimonial");
        }
    };

    // Toggle approval status
    const toggleApproval = async (testimonial: Testimonial) => {
        try {
            const response = await fetch(`/api/testimonials/${testimonial.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ approved: !testimonial.approved }),
            });

            if (response.ok) {
                showToast(
                    testimonial.approved
                        ? "Testimonial unapproved"
                        : "Testimonial approved",
                    "success"
                );
                fetchTestimonials();
            } else {
                const error = await response.json();
                showToast(error.error || "Failed to update testimonial");
            }
        } catch (error) {
            console.error("Error toggling approval:", error);
            showToast("Error updating testimonial");
        }
    };

    // Toggle featured status
    const toggleFeatured = async (testimonial: Testimonial) => {
        try {
            const response = await fetch(`/api/testimonials/${testimonial.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ featured: !testimonial.featured }),
            });

            if (response.ok) {
                showToast(
                    testimonial.featured
                        ? "Testimonial removed from featured"
                        : "Testimonial marked as featured",
                    "success"
                );
                fetchTestimonials();
            } else {
                const error = await response.json();
                showToast(error.error || "Failed to update testimonial");
            }
        } catch (error) {
            console.error("Error toggling featured:", error);
            showToast("Error updating testimonial");
        }
    };

    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Testimonials Management</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage student testimonials displayed on the website
                    </p>
                </div>
                <Button onClick={handleCreate} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Testimonial
                </Button>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
                <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                >
                    All ({testimonials.length})
                </Button>
                <Button
                    variant={filter === "approved" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("approved")}
                >
                    Approved ({testimonials.filter(t => t.approved).length})
                </Button>
                <Button
                    variant={filter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("pending")}
                >
                    Pending ({testimonials.filter(t => !t.approved).length})
                </Button>
                <Button
                    variant={filter === "featured" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("featured")}
                >
                    Featured ({testimonials.filter(t => t.featured).length})
                </Button>
            </div>

            {/* Testimonials grid */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-400">Loading testimonials...</p>
                </div>
            ) : filteredTestimonials.length === 0 ? (
                <Card className="p-8 text-center">
                    <p className="text-gray-400">No testimonials found</p>
                    <p className="text-gray-500 text-sm mt-2">
                        {filter !== "all" ? "Try changing the filter" : "Create your first testimonial"}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTestimonials.map((testimonial) => (
                        <Card key={testimonial.id} className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    {isAvatarImage(testimonial.avatar) ? (
                                        <div
                                            className="w-10 h-10 rounded-full bg-cover bg-center bg-gray-100 shrink-0"
                                            style={{ backgroundImage: `url(${testimonial.avatar})` }}
                                            aria-label={`${testimonial.name} avatar`}
                                        />
                                    ) : (
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                                            style={{ backgroundColor: testimonial.color || DEFAULT_AVATAR_COLOR }}
                                        >
                                            {getAvatarFallback(testimonial)}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                                        <p className="text-gray-500 text-sm">{testimonial.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-3 h-3 ${i < testimonial.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <p className="text-gray-600 text-sm mb-4 line-clamp-3 italic">
                                &ldquo;{testimonial.text}&rdquo;
                            </p>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleApproval(testimonial)}
                                        className={`p-1 rounded ${testimonial.approved ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                                        title={testimonial.approved ? "Approved" : "Pending approval"}
                                    >
                                        {testimonial.approved ? (
                                            <Check className="w-3 h-3" />
                                        ) : (
                                            <X className="w-3 h-3" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => toggleFeatured(testimonial)}
                                        className={`p-1 rounded ${testimonial.featured ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}
                                        title={testimonial.featured ? "Featured" : "Not featured"}
                                    >
                                        <Star className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(testimonial)}
                                        className="p-1 text-gray-500 hover:text-gray-700"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(testimonial.id)}
                                        className="p-1 text-gray-500 hover:text-red-600"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                title={editingTestimonial ? "Edit Testimonial" : "Create New Testimonial"}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name *
                            </label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role *
                            </label>
                            <Input
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                placeholder="Student, Graduate, etc."
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Testimonial Text *
                        </label>
                        <textarea
                            name="text"
                            value={formData.text}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                            placeholder="What did they say about your platform?"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Avatar (initials or URL)
                            </label>
                            <Input
                                name="avatar"
                                value={formData.avatar}
                                onChange={handleInputChange}
                                placeholder="JD or https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rating (1-5)
                            </label>
                            <Input
                                name="rating"
                                type="number"
                                min="1"
                                max="5"
                                value={formData.rating}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Avatar Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {AVATAR_COLOR_PALETTE.map((swatch) => {
                                const isSelected = formData.color.toLowerCase() === swatch.value.toLowerCase();
                                return (
                                    <button
                                        key={swatch.value}
                                        type="button"
                                        onClick={() =>
                                            setFormData((prev) => ({ ...prev, color: swatch.value }))
                                        }
                                        title={`${swatch.name} (${swatch.value})`}
                                        aria-label={`${swatch.name} (${swatch.value})`}
                                        aria-pressed={isSelected}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${isSelected
                                                ? "border-gray-900 ring-2 ring-gray-900 ring-offset-1 scale-110"
                                                : "border-gray-200 hover:border-gray-400 hover:scale-105"
                                            }`}
                                        style={{ backgroundColor: swatch.value }}
                                    />
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">Selected:</span>
                            <span
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700"
                            >
                                <span
                                    className="w-3.5 h-3.5 rounded-full border border-gray-300"
                                    style={{ backgroundColor: formData.color }}
                                />
                                {formData.color}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="approved"
                                checked={formData.approved}
                                onChange={handleCheckboxChange}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Approved</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="featured"
                                checked={formData.featured}
                                onChange={handleCheckboxChange}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Featured</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowModal(false);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            {editingTestimonial ? "Update" : "Create"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}