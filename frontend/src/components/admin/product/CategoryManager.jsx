import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";


const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error); // Add this line
      toast({ title: "Error", description: "Failed to fetch categories", variant: "destructive" });
    }
  };
  
  // Add a new category
  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      toast({ title: "Error", description: "Category name cannot be empty", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setNewCategoryName("");
      fetchCategories();
      toast({ title: "Success", description: "Category added successfully" });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Edit category
  const handleEditCategory = (category) => {
    setEditCategoryId(category._id);
    setEditCategoryName(category.name);
  };

  // Update category
  const handleUpdateCategory = async () => {
    if (!editCategoryId || !editCategoryName.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/categories/${editCategoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editCategoryName }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setEditCategoryId(null);
      setEditCategoryName("");
      fetchCategories();
      toast({ title: "Success", description: "Category updated" });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Delete category
  const handleDeleteCategory = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      fetchCategories();
      toast({ title: "Success", description: "Category deleted" });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Category Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category"
            />
            <Button onClick={handleAddCategory}>
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.map((category) => (
            <div key={category._id} className="flex justify-between p-2 border rounded-md">
              {editCategoryId === category._id ? (
                <div className="flex gap-2">
                  <Input value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} />
                  <Button onClick={handleUpdateCategory}>Save</Button>
                  <Button variant="outline" onClick={() => setEditCategoryId(null)}>Cancel</Button>
                </div>
              ) : (
                <>
                  <span>{category.name}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleEditCategory(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" onClick={() => handleDeleteCategory(category._id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryManager;
