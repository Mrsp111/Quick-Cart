import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, Search, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";


const fetchCustomerQueries = async (page = 1, limit = 10, search = "") => {
  try {
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(search && { search })
    }).toString();

    const response = await fetch(`http://localhost:5000/api/contact?${queryParams}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        status: response.status,
        statusText: response.statusText
      }));
      throw new Error(`Failed to fetch customer queries: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.contacts)) {
      throw new Error("Invalid response format: contacts not found.");
    }

    return {
      queries: data.contacts.map(contact => ({
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
        date: new Date(contact.createdAt).toLocaleDateString()
      })),
      totalPages: data.pagination.pages,
      currentPage: data.pagination.page
    };
  } catch (error) {
    console.error("Error fetching customer queries:", error);
    throw error;
  }
};

const CustomerQueries = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["customerQueries", page, searchTerm],
    queryFn: () => fetchCustomerQueries(page, 10, searchTerm)
  });

  const queries = data?.queries || [];

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleNextPage = () => {
    if (data && page < data.totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleDeleteClick = (query) => {
    setQueryToDelete(query);
    setIsDeleteDialogOpen(true);
  };

  const deleteQuery = async () => {
    if (!queryToDelete) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/contact/${queryToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          status: response.status,
          statusText: response.statusText
        }));
        throw new Error(`Failed to delete query: ${errorData.message || response.statusText}`);
      }
      
      toast.success("Query deleted successfully");
      refetch(); // Refresh the data
    } catch (error) {
      console.error("Error deleting query:", error);
      toast.error(error.message || "Failed to delete query");
    } finally {
      setIsDeleteDialogOpen(false);
      setQueryToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-md shadow-md space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md text-center">
        <h3 className="text-red-800 font-semibold text-lg">Error loading customer queries</h3>
        <p className="text-red-600 mt-2">{error.message}</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Customer Queries</h1>
            <p className="text-sm text-gray-500">
              <Link to="/admin/dashboard" className="hover:underline">Home</Link> &gt; Customer Queries
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input 
                type="text" 
                placeholder="Search by name, email or subject" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-64"
              />
              <Button type="submit" variant="outline" className="bg-white text-sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </div>
        </div>

        <Card className="shadow-lg">
          <div className="p-8 text-center">
            <div className="mb-4 text-gray-400">
              <Search className="h-12 w-12 mx-auto mb-2" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Customer Queries Found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 
                "No queries match your search criteria. Try different keywords or clear the search." :
                "There are no customer queries at the moment. New queries will appear here when customers contact us."}
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput("");
                  setSearchTerm("");
                }}
              >
                Clear Search
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customer Queries</h1>
          <p className="text-sm text-gray-500">
            <Link to="/admin/dashboard" className="hover:underline">Home</Link> &gt; Customer Queries
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input 
              type="text" 
              placeholder="Search by name, email or subject" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-64"
            />
            <Button type="submit" variant="outline" className="bg-white text-sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </div>
      </div>

      <Card className="shadow-lg">
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-white flex justify-between items-center">
          <h2 className="text-lg font-semibold">Customer Messages</h2>
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queries.length > 0 ? (
                queries.map((query) => (
                  <TableRow key={query.id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>{query.name}</TableCell>
                    <TableCell>{query.email}</TableCell>
                    <TableCell>{query.subject}</TableCell>
                    <TableCell className="max-w-xs truncate">{query.message}</TableCell>
                    <TableCell>{query.date}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteClick(query)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No customer queries found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {queries.length > 0 && (
          <div className="p-4 flex justify-between items-center border-t">
            <div className="text-sm text-gray-500">
              Showing page {data?.currentPage} of {data?.totalPages}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handlePrevPage} 
                disabled={page <= 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button 
                onClick={handleNextPage} 
                disabled={!data || page >= data.totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

     {/* Delete Confirmation Dialog */}
<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <AlertDialogContent className="bg-white rounded-xl shadow-2xl p-6 transition-all duration-300 ease-in-out max-w-md w-full">
    <AlertDialogHeader className="flex flex-col items-center text-center space-y-4">
      {/* Warning Icon */}
      <div className="text-red-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" />
        </svg>
      </div>

      <AlertDialogTitle className="text-xl font-bold text-gray-800">Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription className="text-gray-600">
        This action cannot be undone. It will permanently delete the customer query from the database.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter className="mt-6 flex justify-end space-x-3">
      <AlertDialogCancel className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition">
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={deleteQuery}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

    </div>
  );
};

export default CustomerQueries;