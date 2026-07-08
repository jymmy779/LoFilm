import Link from 'next/link';
import Image from 'next/image';
import './not-found.css';

export const metadata = {
    title: '404 - Không tìm thấy trang | LoFilm',
};

export default function NotFound() {
    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <div className="not-found-image-container">
                    <Image 
                        src="/images/404_lofilm.png" 
                        alt="404 LoFilm" 
                        width={200} 
                        height={130} 
                        className="not-found-image"
                        priority
                    />
                </div>
                <h2 className="not-found-heading">Lỗi 404 - Không tìm thấy trang</h2>
                <p className="not-found-text">
                    Trang bạn đang tìm kiếm không tồn tại. Vui lòng kiểm tra đường dẫn hoặc quay về trang chủ.
                </p>
                <Link href="/" className="back-home-button">
                    Về trang chủ
                </Link>
            </div>
        </div>
    );
}
