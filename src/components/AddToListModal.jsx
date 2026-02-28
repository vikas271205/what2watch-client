import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getUserLists, addItemToList } from "../utils/listService";

const AddToListModal = ({ isOpen, onClose, movie }) => {
  const { user } = useContext(AuthContext);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchLists = async () => {
      setLoading(true);
      const data = await getUserLists(user.uid);
      setLists(data);
      setLoading(false);
    };

    fetchLists();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleAdd = async (listId) => {
    try {
      setAdding(listId);

      await addItemToList({
        listId,
        tmdbId: movie.id,
        mediaType: movie.media_type || movie.mediaType,
        title: movie.title || movie.name,
        posterPath: movie.poster_path,
        user,
      });

      alert("Added successfully");
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white text-black w-full max-w-md rounded p-6 relative">
        <h2 className="text-xl font-bold mb-4">Add to List</h2>

        {loading ? (
          <p>Loading lists...</p>
        ) : lists.length === 0 ? (
          <p>You have no lists yet.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {lists.map((list) => (
              <button
                key={list.id}
                onClick={() => handleAdd(list.id)}
                disabled={adding === list.id}
                className="w-full text-left p-3 border rounded hover:bg-gray-100"
              >
                <div className="font-semibold">{list.title}</div>
                <div className="text-sm text-gray-600">
                  {list.itemsCount} items
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-600 underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddToListModal;