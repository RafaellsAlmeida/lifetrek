import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImageEditorCore } from "@/components/admin/content/ImageEditorCore";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ImageEditor() {
  const [searchParams] = useSearchParams();
  const postId = searchParams.get("postId");
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <ImageEditorCore 
        postId={postId} 
        onBack={() => navigate(-1)} 
      />
    </AdminLayout>
  );
}
