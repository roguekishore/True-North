import MEDS from "./MEDS";
import SAS from "./SAS";
import '../css/SasMeds.css'

function SasMeds({ userId }){
    return(
        <div className="sasmeds-container">
            <SAS userId={userId} />
            <MEDS userId={userId} />
        </div>
    )
}

export default SasMeds;