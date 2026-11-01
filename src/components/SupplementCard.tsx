//컴포넌트가 전달받을 데이터의 타입 정의 
type SupplementCardProps = {
    name : string; 
    stock : number;
};

//Props로 영양제 이름과 현재 재고를 전달받는다 
function SupplementCard({name, stock}: SupplementCardProps){
    return (
        <div>
            <h2>{name}</h2>
            <p>현재 재고: {stock}정</p>
            <button>상세 보기</button>
        </div>
    );
}

//다른 파일에서도 이 컴포넌트를 사용할 수 있게 내보낸다 
export default SupplementCard;