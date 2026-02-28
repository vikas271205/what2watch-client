import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { createList } from "../utils/listService";
import { AuthContext } from "../context/AuthContext";

const CreateList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    try {
      setLoading(true);

      const listId = await createList({
        title,
        description,
        isPublic,
        user,
      });

      navigate(`/list/${listId}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create New List</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="List Title"
          className="w-full p-3 border rounded bg-white text-black"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          required
        />

        <textarea
          placeholder="Description (optional)"
          className="w-full p-3 border rounded bg-white text-black"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
          />
          <span>Public List</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded"
        >
          {loading ? "Creating..." : "Create List"}
        </button>
      </form>
    </div>
  );
};

export default CreateList;