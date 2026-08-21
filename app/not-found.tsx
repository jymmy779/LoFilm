import Link from 'next/link';
import Image from 'next/image';
import './not-found.css';

export const metadata = {
    title: '404 - Không tìm thấy trang | CineStream',
};

export default function NotFound() {
    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <div className="not-found-image-container">
                    <Image 
                        src="/icon.svg" 
                        alt="404 CineStream" 
                        width={100} 
                        height={100} 
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
