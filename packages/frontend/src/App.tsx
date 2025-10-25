import {Routes, Route} from "react-router-dom";
import {Layout} from "@/components/Layout";
import {HomePage} from "@/pages/HomePage";
import {LearningPathsPage} from "@/pages/LearningPathsPage";
import {LearningPathDetailPage} from "@/pages/LearningPathDetailPage";
import {ProfilePage} from "@/pages/ProfilePage";
import {NotFoundPage} from "@/pages/NotFoundPage";

function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/learning-paths" element={<LearningPathsPage />} />
                <Route
                    path="/learning-paths/:id"
                    element={<LearningPathDetailPage />}
                />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Layout>
    );
}

export default App;
