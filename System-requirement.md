Hệ thống E‑commerce PC + Build & Bottleneck (Monolith MVP)
1. Tổng quan
Ứng dụng web bán linh kiện máy tính, cho phép khách hàng tự build cấu hình PC với kiểm tra tương thích tự động và phân tích bottleneck CPU/GPU.
Kiến trúc Modular Monolith với Spring Boot, toàn bộ module chạy trong một ứng dụng, chia package rõ ràng.

Các module chức năng:

Auth – Đăng ký, đăng nhập, phân quyền.

Product – Quản lý sản phẩm (danh mục, thương hiệu, sản phẩm, ảnh, thông số).

Supplier & Inventory – Nhà cung cấp, đơn nhập hàng, quản lý lô (batch), tồn kho.

Order – Đơn hàng, xử lý bán hàng theo FIFO.

PC Build & Bottleneck – Tạo cấu hình, kiểm tra tương thích,Mô hình học máy kiểm tra mức độ nghẽn giữa các linh kiện.

Chatbot – FAQ, tìm kiếm sản phẩm.

2. Luồng nghiệp vụ
2.1 Thiết lập sản phẩm (cho hiển thị FE)
Admin tạo sản phẩm trước khi nhập hàng: Điền đầy đủ name, price, thumbnail_url, description, specs, chọn category, brand.

Sản phẩm được lưu với stock = 0. FE có thể hiển thị sản phẩm (trạng thái "Sắp về hàng" hoặc ẩn tuỳ ý).

Tất cả dữ liệu hiển thị (ảnh, thông số) được setup tại bước này, độc lập với nhập hàng.

2.2 Nhập hàng
Admin tạo Purchase Order (PO): chọn nhà cung cấp, thêm danh sách sản phẩm (product_id, số lượng, giá nhập). PO có status = 'DRAFT'.

Khi hàng về kho, admin gọi API "Nhận hàng" (receive).

Với mỗi item trong PO:

Tạo inventory_batch (quantity, remaining_quantity = quantity, import_price).

Cập nhật products.stock += quantity.

Đổi PO status sang RECEIVED.

Transaction: nếu lỗi, rollback toàn bộ.

2.3 Khách mua hàng (FIFO)
Khách checkout (từ giỏ hàng hoặc mua ngay) -> gửi danh sách {productId, quantity}.

Hệ thống tạo order (status PENDING).

Với mỗi item:

Lấy tất cả inventory_batches của sản phẩm có remaining_quantity > 0, sắp xếp theo imported_at ASC.

Trừ dần quantity cần mua từ các batch cũ nhất. Tính cost_price (trung bình trọng số nếu dùng nhiều batch).

Cập nhật remaining_quantity của batch.

Giảm products.stock.

Tạo order_item với selling_price = products.price, cost_price từ bước trên.

Xác nhận đơn hàng (chuyển CONFIRMED).

2.4 Build PC & Bottleneck
Khách tạo build mới (chỉ cần tên).

Thêm CPU: chọn từ danh mục CPU.

Thêm GPU: chọn từ danh mục GPU. Ngay khi có CPU + GPU, hệ thống tra bảng bottleneck_profiles và trả về % nghẽn, fps.

Chọn Mainboard: Hệ thống chỉ hiển thị mainboard có specs->>'socket' = CPU.socket và specs->>'ram_type' = CPU.ram_type.

Chọn RAM: lọc theo specs->>'type' = CPU.ram_type.

Chọn PSU: Hệ thống tính tổng TDP từ specs->>'tdp' của tất cả linh kiện, gợi ý PSU công suất ≥ tổng TDP * 1.3.

Chọn Case, Storage (tuỳ chọn).

Mỗi thay đổi cập nhật total_price, total_power.

Nút "Mua cả bộ": tạo Order với tất cả item trong build, xử lý FIFO như mua lẻ.

3.5 Chatbot
Nhận câu hỏi -> tìm trong bảng faq.

Nếu không có, full-text search trong products.name, products.description.

Gọi OpenAI API với context là top 3-5 sản phẩm tìm được.

Trả lời khách.

3.Các API Endpoints (localhost:8080) Lưu ý để call đúng API
Module	Endpoint	Method	Mô tả
Auth	/api/auth/register	POST	Đăng ký
Auth	/api/auth/login	POST	Lấy JWT
Product	/api/products	GET	Danh sách (filter, search, phân trang)
Product	/api/products/{id}	GET	Chi tiết sản phẩm
Admin Product	/api/admin/products	POST	Tạo sản phẩm (ADMIN)
Admin Product	/api/admin/products/{id}	PUT	Cập nhật sản phẩm
Admin Product	/api/admin/products/{id}	DELETE	Xoá (nếu cần)
Supplier	/api/admin/suppliers	GET/POST	Quản lý supplier
PO	/api/admin/purchase-orders	POST	Tạo PO
PO	/api/admin/purchase-orders	GET	Danh sách PO
PO	/api/admin/purchase-orders/{id}	GET	Chi tiết PO
PO	/api/admin/purchase-orders/{id}/receive	PUT	Nhận hàng, tạo batch, tăng stock
Order	/api/orders	POST	Tạo đơn (body: items)
Order	/api/orders	GET	Đơn hàng của user
Order	/api/orders/{id}	GET	Chi tiết đơn
Build	/api/builds	GET/POST	Danh sách / tạo build
Build	/api/builds/{id}	GET	Chi tiết build + bottleneck
Build	/api/builds/{id}/items	POST	Thêm linh kiện
Build	/api/builds/{id}/items/{itemId}	PUT	Đổi linh kiện
Build	/api/builds/{id}/items/{itemId}	DELETE	Xoá linh kiện
Build	/api/builds/{id}/compatible-components	GET	Lấy linh kiện tương thích (?type=MAINBOARD)
Bottleneck	/api/bottleneck	GET	Tra cứu (?cpuId=&gpuId=&res=)
Chatbot	/api/chat	POST	Gửi tin nhắn
