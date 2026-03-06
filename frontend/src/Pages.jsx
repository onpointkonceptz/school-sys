import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, Search, Filter, MoreVertical, X, User, CreditCard, Calendar, CheckCircle, AlertCircle, ChevronDown, School, Users, FileText, UserPlus, UserCheck, GraduationCap, Banknote, Mail, Phone, MapPin, Clock, BookOpen, CheckCircle2, XCircle, Download, Trash2, Edit, Loader2, Camera, LogOut, CheckSquare, Key } from 'lucide-react';
import PaymentModal from './components/PaymentModal';
import AccountsComponent from './Accounts';
import InventoryComponent from './Inventory';
import AcademicsComponent from './Academics'; // Added Academics import

// --- API Helper ---
const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Attach CSRF token from cookie on every request (required by DRF SessionAuthentication)
api.interceptors.request.use(config => {
    const match = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
    if (match) config.headers['X-CSRFToken'] = match.split('=')[1];
    return config;
});

// Reusable Components
const PageHeader = ({ title, subTitle, actionLabel, onAction }) => (
    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
            <h1 className="text-2xl font-bold text-[#001f3f]">{title}</h1>
            <p className="text-gray-500 text-sm mt-1">{subTitle}</p>
        </div>
        <div className="flex gap-3">
            <button onClick={onAction} className="flex items-center gap-2 bg-gradient-to-r from-orange to-orange-dark text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange/20 transition-all transform hover:-translate-y-0.5 font-medium text-sm">
                <Plus size={18} />
                <span>{actionLabel}</span>
            </button>
        </div>
    </div>
);

const Table = ({ headers, data, renderRow }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i} className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                {h}
                            </th>
                        ))}

                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition duration-150">
                            {renderRow(item)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {data.length === 0 && (
            <div className="p-12 text-center text-gray-400">
                No records found.
            </div>
        )}
    </div>
);

// --- Nigerian Geography Data ---
const COUNTRIES = [
    'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Argentine', 'Armenian',
    'Australian', 'Austrian', 'Azerbaijani', 'Bahamian', 'Bahraini', 'Bangladeshi', 'Belarusian',
    'Belgian', 'Belizean', 'Beninese', 'Bhutanese', 'Bolivian', 'Bosnian', 'Brazilian', 'British',
    'Bulgarian', 'Burkinabe', 'Burundian', 'Cambodian', 'Cameroonian', 'Canadian', 'Central African',
    'Chadian', 'Chilean', 'Chinese', 'Colombian', 'Congolese', 'Costa Rican', 'Croatian', 'Cuban',
    'Cypriot', 'Czech', 'Danish', 'Djiboutian', 'Dominican', 'Dutch', 'Ecuadorian', 'Egyptian',
    'Emirati', 'Eritrean', 'Estonian', 'Eswatini', 'Ethiopian', 'Fijian', 'Finnish', 'French',
    'Gabonese', 'Gambian', 'Georgian', 'German', 'Ghanaian', 'Greek', 'Guatemalan', 'Guinean',
    'Guyanese', 'Haitian', 'Honduran', 'Hungarian', 'Icelandic', 'Indian', 'Indonesian', 'Iranian',
    'Iraqi', 'Irish', 'Israeli', 'Italian', 'Ivorian', 'Jamaican', 'Japanese', 'Jordanian',
    'Kazakhstani', 'Kenyan', 'Kuwaiti', 'Kyrgyz', 'Laotian', 'Latvian', 'Lebanese', 'Liberian',
    'Libyan', 'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malagasy', 'Malawian', 'Malaysian',
    'Maldivian', 'Malian', 'Maltese', 'Mauritanian', 'Mauritian', 'Mexican', 'Moldovan', 'Mongolian',
    'Montenegrin', 'Moroccan', 'Mozambican', 'Myanmar', 'Namibian', 'Nepalese', 'New Zealander',
    'Nicaraguan', 'Nigerien', 'Nigerian', 'Norwegian', 'Omani', 'Pakistani', 'Panamanian',
    'Papua New Guinean', 'Paraguayan', 'Peruvian', 'Philippine', 'Polish', 'Portuguese', 'Qatari',
    'Romanian', 'Russian', 'Rwandan', 'Saudi', 'Senegalese', 'Serbian', 'Sierra Leonean',
    'Singaporean', 'Slovak', 'Slovenian', 'Somali', 'South African', 'South Korean', 'South Sudanese',
    'Spanish', 'Sri Lankan', 'Sudanese', 'Surinamese', 'Swedish', 'Swiss', 'Syrian', 'Taiwanese',
    'Tajik', 'Tanzanian', 'Thai', 'Togolese', 'Trinidadian', 'Tunisian', 'Turkish', 'Turkmen',
    'Ugandan', 'Ukrainian', 'Uruguayan', 'Uzbek', 'Venezuelan', 'Vietnamese', 'Yemeni', 'Zambian', 'Zimbabwean'
];

const NIGERIA_STATES_LGAS = {
    'Abia': ['Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa North', 'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa', 'Ohafia', 'Osisioma Ngwa', 'Ugwunagbo', 'Ukwa East', 'Ukwa West', 'Umuahia North', 'Umuahia South', 'Umu Nneochi'],
    'Adamawa': ['Demsa', 'Fufure', 'Ganye', 'Gayuk', 'Gombi', 'Grie', 'Hong', 'Jada', 'Lamurde', 'Madagali', 'Maiha', 'Mayo Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan', 'Shelleng', 'Song', 'Toungo', 'Yola North', 'Yola South'],
    'Akwa Ibom': ['Abak', 'Eastern Obolo', 'Eket', 'Esit Eket', 'Essien Udim', 'Etim Ekpo', 'Etinan', 'Ibeno', 'Ibesikpo Asutan', 'Ibiono-Ibom', 'Ika', 'Ikono', 'Ikot Abasi', 'Ikot Ekpene', 'Ini', 'Itu', 'Mbo', 'Mkpat-Enin', 'Nsit-Atai', 'Nsit-Ibom', 'Nsit-Ubium', 'Obot Akara', 'Okobo', 'Onna', 'Oron', 'Oruk Anam', 'Udung-Uko', 'Ukanafun', 'Uruan', 'Urue-Offong/Oruko', 'Uyo'],
    'Anambra': ['Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 'Awka South', 'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South', 'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South', 'Orumba North', 'Orumba South', 'Oyi'],
    'Bauchi': ['Alkaleri', 'Bauchi', 'Bogoro', 'Damban', 'Darazo', 'Dass', 'Gamawa', 'Ganjuwa', 'Giade', 'Itas/Gadau', 'Jamaare', 'Katagum', 'Kirfi', 'Misau', 'Ningi', 'Shira', 'Tafawa Balewa', 'Toro', 'Warji', 'Zaki'],
    'Bayelsa': ['Brass', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe', 'Ogbia', 'Sagbama', 'Southern Ijaw', 'Yenagoa'],
    'Benue': ['Ado', 'Agatu', 'Apa', 'Buruku', 'Gboko', 'Guma', 'Gwer East', 'Gwer West', 'Katsina-Ala', 'Konshisha', 'Kwande', 'Logo', 'Makurdi', 'Obi', 'Ogbadibo', 'Ohimini', 'Oju', 'Okpokwu', 'Otukpo', 'Tarka', 'Ukum', 'Ushongo', 'Vandeikya'],
    'Borno': ['Abadam', 'Askira/Uba', 'Bama', 'Bayo', 'Biu', 'Chibok', 'Damboa', 'Dikwa', 'Gubio', 'Guzamala', 'Gwoza', 'Hawul', 'Jere', 'Kaga', 'Kala/Balge', 'Konduga', 'Kukawa', 'Kwaya Kusar', 'Mafa', 'Magumeri', 'Maiduguri', 'Marte', 'Mobbar', 'Monguno', 'Ngala', 'Nganzai', 'Shani'],
    'Cross River': ['Abi', 'Akamkpa', 'Akpabuyo', 'Bekwara', 'Biase', 'Boki', 'Calabar Municipal', 'Calabar South', 'Etung', 'Ikom', 'Obanliku', 'Obubra', 'Obudu', 'Odukpani', 'Ogoja', 'Yakuur', 'Yala'],
    'Delta': ['Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Ethiope East', 'Ethiope West', 'Ika North East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West', 'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele', 'Udu', 'Ughelli North', 'Ughelli South', 'Ukwuani', 'Uvwie', 'Warri North', 'Warri South', 'Warri South West'],
    'Ebonyi': ['Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North', 'Ezza South', 'Ikwo', 'Ishielu', 'Ivo', 'Izzi', 'Ohaozara', 'Ohaukwu', 'Onicha'],
    'Edo': ['Akoko-Edo', 'Egor', 'Esan Central', 'Esan North-East', 'Esan South-East', 'Esan West', 'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben', 'Ikpoba Okha', 'Orhionmwon', 'Owan East', 'Owan West', 'Uhunmwonde'],
    'Ekiti': ['Ado Ekiti', 'Efon', 'Ekiti East', 'Ekiti South-West', 'Ekiti West', 'Emure', 'Gbonyin', 'Ido Osi', 'Ijero', 'Ikere', 'Ikole', 'Ilejemeje', 'Irepodun/Ifelodun', 'Ise/Orun', 'Moba', 'Oye'],
    'Enugu': ['Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu', 'Igbo Etiti', 'Igbo Eze North', 'Igbo Eze South', 'Isi Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka', 'Oji River', 'Udenu', 'Udi', 'Uzo Uwani'],
    'FCT': ['Abaji', 'Abuja Municipal', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali'],
    'Gombe': ['Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe', 'Kaltungo', 'Kwami', 'Nafada', 'Shongom', 'Yamaltu/Deba'],
    'Imo': ['Aboh Mbaise', 'Ahiazu Mbaise', 'Ehime Mbano', 'Ezinihitte', 'Ideato North', 'Ideato South', 'Ihitte/Uboma', 'Ikeduru', 'Isiala Mbano', 'Isu', 'Mbaitoli', 'Ngor Okpala', 'Njaba', 'Nkwerre', 'Nwangele', 'Obowo', 'Oguta', 'Ohaji/Egbema', 'Okigwe', 'Onuimo', 'Orlu', 'Orsu', 'Oru East', 'Oru West', 'Owerri Municipal', 'Owerri North', 'Owerri West'],
    'Jigawa': ['Auyo', 'Babura', 'Biriniwa', 'Birnin Kudu', 'Buji', 'Dutse', 'Gagarawa', 'Garki', 'Gumel', 'Guri', 'Gwaram', 'Gwiwa', 'Hadejia', 'Jahun', 'Kafin Hausa', 'Kazaure', 'Kiri Kasama', 'Kiyawa', 'Kaugama', 'Maigatari', 'Malam Madori', 'Miga', 'Ringim', 'Roni', 'Sule Tankarkar', 'Taura', 'Yankwashi'],
    'Kaduna': ['Birnin Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', 'Jema a', 'Kachia', 'Kaduna North', 'Kaduna South', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau', 'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga', 'Soba', 'Zangon Kataf', 'Zaria'],
    'Kano': ['Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta', 'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun Mallam', 'Gaya', 'Gezawa', 'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya', 'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Nasarawa', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takai', 'Tarauni', 'Tofa', 'Tsanyawa', 'Tudun Wada', 'Ungogo', 'Warawa', 'Wudil'],
    'Katsina': ['Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa', 'Charanchi', 'Dandume', 'Danja', 'Dan Musa', 'Daura', 'Dutsi', 'Dutsin-Ma', 'Faskari', 'Funtua', 'Ingawa', 'Jibia', 'Kafur', 'Kaita', 'Kankara', 'Kankia', 'Katsina', 'Kurfi', 'Kusada', 'Mai adua', 'Malumfashi', 'Mani', 'Mashi', 'Matazu', 'Musawa', 'Rimi', 'Sabuwa', 'Safana', 'Sandamu', 'Zango'],
    'Kebbi': ['Aleiro', 'Arewa Dandi', 'Argungu', 'Augie', 'Bagudo', 'Birnin Kebbi', 'Bunza', 'Dandi', 'Fakai', 'Gwandu', 'Jega', 'Kalgo', 'Koko/Besse', 'Maiyama', 'Ngaski', 'Sakaba', 'Shanga', 'Suru', 'Wasagu/Danko', 'Yauri', 'Zuru'],
    'Kogi': ['Adavi', 'Ajaokuta', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji', 'Idah', 'Igalamela Odolu', 'Ijumu', 'Kabba/Bunu', 'Kogi', 'Lokoja', 'Mopa Muro', 'Ofu', 'Ogori/Magongo', 'Okehi', 'Okene', 'Olamaboro', 'Omala', 'Yagba East', 'Yagba West'],
    'Kwara': ['Asa', 'Baruten', 'Edu', 'Ekiti', 'Ifelodun', 'Ilorin East', 'Ilorin South', 'Ilorin West', 'Irepodun', 'Isin', 'Kaiama', 'Moro', 'Offa', 'Oke Ero', 'Oyun', 'Pategi'],
    'Lagos': ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Epe', 'Eti Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'],
    'Nasarawa': ['Akwanga', 'Awe', 'Doma', 'Karu', 'Keana', 'Keffi', 'Kokona', 'Lafia', 'Nasarawa', 'Nasarawa Egon', 'Obi', 'Toto', 'Wamba'],
    'Niger': ['Agaie', 'Agwara', 'Bida', 'Borgu', 'Bosso', 'Chanchaga', 'Edati', 'Gbako', 'Gurara', 'Katcha', 'Kontagora', 'Lapai', 'Lavun', 'Magama', 'Mariga', 'Mashegu', 'Mokwa', 'Moya', 'Paikoro', 'Rafi', 'Rijau', 'Shiroro', 'Suleja', 'Tafa', 'Wushishi'],
    'Ogun': ['Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Egbado North', 'Egbado South', 'Ewekoro', 'Ifo', 'Ijebu East', 'Ijebu North', 'Ijebu North East', 'Ijebu Ode', 'Ikenne', 'Imeko-Afon', 'Ipokia', 'Obafemi Owode', 'Odeda', 'Odogbolu', 'Ogun Waterside', 'Remo North', 'Shagamu'],
    'Ondo': ['Akoko North-East', 'Akoko North-West', 'Akoko South-East', 'Akoko South-West', 'Akure North', 'Akure South', 'Ese Odo', 'Idanre', 'Ifedore', 'Ilaje', 'Ile Oluji/Okeigbo', 'Irele', 'Odigbo', 'Okitipupa', 'Ondo East', 'Ondo West', 'Ose', 'Owo'],
    'Osun': ['Aiyedade', 'Aiyedire', 'Atakumosa East', 'Atakumosa West', 'Boluwaduro', 'Boripe', 'Ede North', 'Ede South', 'Ife Central', 'Ife East', 'Ife North', 'Ife South', 'Ifedayo', 'Ifelodun', 'Ila', 'Ilesa East', 'Ilesa West', 'Irepodun', 'Irewole', 'Isokan', 'Iwo', 'Obokun', 'Odo Otin', 'Ola Oluwa', 'Olorunda', 'Oriade', 'Orolu', 'Osogbo'],
    'Oyo': ['Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa', 'Kajola', 'Lagelu', 'Ogbomosho North', 'Ogbomosho South', 'Ogo Oluwa', 'Olorunsogo', 'Oluyole', 'Ona Ara', 'Orelope', 'Ori Ire', 'Oyo East', 'Oyo West', 'Saki East', 'Saki West', 'Surulere'],
    'Plateau': ['Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South', 'Kanam', 'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang', 'Pankshin', 'Qua an Pan', 'Riyom', 'Shendam', 'Wase'],
    'Rivers': ['Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni', 'Asari-Toru', 'Bonny', 'Degema', 'Eleme', 'Emuoha', 'Etche', 'Gokana', 'Ikwerre', 'Khana', 'Obio/Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro', 'Oyigbo', 'Port Harcourt', 'Tai'],
    'Sokoto': ['Binji', 'Bodinga', 'Dange Shuni', 'Gada', 'Goronyo', 'Gudu', 'Gwadabawa', 'Illela', 'Isa', 'Kebbe', 'Kware', 'Rabah', 'Sabon Birni', 'Shagari', 'Silame', 'Sokoto North', 'Sokoto South', 'Tambuwal', 'Tangaza', 'Tureta', 'Wamako', 'Wurno', 'Yabo'],
    'Taraba': ['Ardo Kola', 'Bali', 'Donga', 'Gashaka', 'Gassol', 'Ibi', 'Jalingo', 'Karim Lamido', 'Kumi', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Wukari', 'Yorro', 'Zing'],
    'Yobe': ['Bade', 'Bursari', 'Damaturu', 'Fika', 'Fune', 'Geidam', 'Gujba', 'Gulani', 'Jakusko', 'Karasuwa', 'Machina', 'Nangere', 'Nguru', 'Potiskum', 'Tarmuwa', 'Yunusari', 'Yusufari'],
    'Zamfara': ['Anka', 'Bakura', 'Birnin Magaji/Kiyaw', 'Bukkuyum', 'Bungudu', 'Gummi', 'Gusau', 'Kaura Namoda', 'Maradun', 'Maru', 'Shinkafi', 'Talata Mafara', 'Tsafe', 'Zurmi']
};
const NIGERIA_STATE_NAMES = Object.keys(NIGERIA_STATES_LGAS).sort();

// --- Pages ---

export const Students = ({ onNavigate, navData, user }) => {
    // Payment management is only available to non-teacher roles
    const canManagePayments = user?.role ? !['TEACHER'].includes(user.role) : true;
    // View State
    const [viewMode, setViewMode] = useState('DASHBOARD');
    const [selectionMode, setSelectionMode] = useState('VIEW'); // 'VIEW' or 'PAYMENT'
    const [selectedClass, setSelectedClass] = useState(null);
    const [classStats, setClassStats] = useState([]);
    const [students, setStudents] = useState([]);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [globalSearchResults, setGlobalSearchResults] = useState([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPromoteModal, setShowPromoteModal] = useState(false);

    // New Modals State
    const [viewProfile, setViewProfile] = useState(null); // Student Object
    const [editingStudent, setEditingStudent] = useState(null); // Student Object
    const [managingPayments, setManagingPayments] = useState(null); // Student Object
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentStudent, setPaymentStudent] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null); // Student Object
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    const [submitError, setSubmitError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [savedAdmissionNumber, setSavedAdmissionNumber] = useState(null); // shown after save

    // Form State for Add/Edit
    const initialFormState = {
        first_name: '', last_name: '', admission_number: '',
        class_grade: 'JSS_1', student_type: 'DAY', student_status: 'NEW',
        parent_name: '', parent_phone: '', parent_email: '', parent_address: '',
        current_term: '1st Term', current_session: '2025/2026',
        // New Fields
        date_of_admission: '', previous_school: '',
        date_of_birth: '', gender: 'MALE', nationality: 'Nigerian',
        state_of_origin: '', lga: '', religion: '', blood_group: '', genotype: '',
        medical_conditions: '', special_needs: '',
        father_name: '', father_phone: '', father_occupation: '',
        mother_name: '', mother_phone: '', mother_occupation: '',
        emergency_contact_name: '', emergency_contact_phone: ''
    };
    const [formData, setFormData] = useState(initialFormState);
    const [feePreview, setFeePreview] = useState({ amount: 0, breakdown: [] });

    // Click Outside listener for dropdowns
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Initial Load
    useEffect(() => {
        fetchDashboardStats();
    }, []);

    // Sync Selection Mode from Navigation
    useEffect(() => {
        if (navData && navData.mode === 'PAYMENT') {
            setSelectionMode('PAYMENT');
            setViewMode('DASHBOARD'); // Start at dashboard to select class
        } else {
            setSelectionMode('VIEW');
        }
    }, [navData]);

    // Fee Calculation Effect
    useEffect(() => {
        if (showAddModal || editingStudent) {
            calculateFees();
        }
    }, [formData.class_grade, formData.student_type, formData.student_status, showAddModal, editingStudent]);

    // Global Search Effect
    useEffect(() => {
        if (viewMode === 'DASHBOARD' && searchTerm) {
            const delaySearch = setTimeout(() => fetchGlobalSearch(searchTerm), 500);
            return () => clearTimeout(delaySearch);
        } else if (viewMode === 'DASHBOARD' && !searchTerm) {
            setGlobalSearchResults([]);
        }
    }, [searchTerm, viewMode]);

    // --- API Calls ---

    const fetchGlobalSearch = async (term) => {
        try {
            const res = await api.get(`/students/?search=${term}`);
            setGlobalSearchResults(res.data);
        } catch (error) {
            console.error("Search failed", error);
        }
    };

    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            const res = await api.get('/students/dashboard-stats/');
            setClassStats(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch stats", error);
            setLoading(false);
        }
    };

    const fetchStudentsByClass = async (classCode) => {
        setLoading(true);
        try {
            const res = await api.get(`/students/?class_grade=${classCode}`);
            setStudents(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch students", error);
            setLoading(false);
        }
    };

    const fetchTransactions = async (studentId) => {
        try {
            const res = await api.get('/accounts/transactions/');
            // Filter client-side since API returns all
            const studentTxns = res.data.filter(t => t.admission_number === studentId);
            return studentTxns;
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    const calculateFees = async () => {
        try {
            const params = {
                class_grade: formData.class_grade,
                student_type: formData.student_type,
                student_status: formData.student_status
            };
            const res = await api.get('/accounts/fee-config/', { params });
            setFeePreview(res.data);
        } catch (error) {
            console.error("Fee calc error", error);
        }
    };

    // --- Handlers ---

    const handleClassClick = (cls) => {
        setSelectedClass(cls);
        setViewMode('CLASS_LIST');
        setSearchTerm('');
        fetchStudentsByClass(cls.code);
    };

    const handleBackToDashboard = () => {
        setViewMode('DASHBOARD');
        setSelectedClass(null);
        setSearchTerm('');
        setGlobalSearchResults([]);
        fetchDashboardStats();
    };



    const openAddModal = (type) => {
        setFormData({ ...initialFormState, student_status: type });
        if (selectedClass) {
            setFormData(prev => ({ ...prev, class_grade: selectedClass.code }));
        }
        setShowSelectionModal(false);
        setShowAddModal(true);
        setEditingStudent(null);
    };

    const openEditModal = (student) => {
        setEditingStudent(student);
        // We fetch full details to ensure we have everything
        api.get(`/students/${student.id}/`).then(res => {
            const s = res.data;
            setFormData({
                first_name: s.first_name,
                last_name: s.last_name,
                admission_number: s.admission_number,
                class_grade: s.class_grade, // Note: This might need mapping if API returns display vs code
                student_type: s.student_type,
                student_status: s.student_status,
                parent_name: s.parent_name,
                parent_phone: s.parent_phone,
                parent_email: s.parent_email,
                current_term: s.current_term,
                current_session: s.current_session
            });
            setShowAddModal(true);
            setActiveDropdown(null);
        }).catch(err => {
            console.error(err);
            alert("Failed to load student details");
        });
    };

    const openProfile = async (student) => {
        setViewProfile(student);
        const txns = await fetchTransactions(student.admission_number);
        setTransactions(txns);

        // Refresh details for updated balance
        try {
            const res = await api.get(`/students/${student.id}/`);
            setViewProfile(prev => ({ ...prev, ...res.data }));
        } catch (e) { console.error(e); }
    };

    const openPaymentManager = async (student) => {
        setManagingPayments(student);
        const txns = await fetchTransactions(student.admission_number);
        setTransactions(txns);
        setActiveDropdown(null);
    };

    const handleMakePayment = (student) => {
        setPaymentStudent(student);
        setPaymentModalOpen(true);
        setActiveDropdown(null);
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Handle PROMOTION / RETURNING Student logic
            if (formData.student_status === 'RETURNING' && formData.id) {
                const response = await api.post(`/students/${formData.id}/promote/`, {
                    new_class: formData.class_grade,
                    new_session: formData.current_session,
                    student_status: 'ACTIVE' // Default to active upon promotion
                });

                if (response.data.success) {
                    // Refresh
                    if (viewMode === 'CLASS_LIST' && selectedClass) fetchStudentsByClass(selectedClass.code);
                    else fetchDashboardStats();
                    setShowAddModal(false);
                    setFormData(initialFormState);
                    alert("Student Promoted Successfully!");
                } else {
                    alert("Failed to promote student: " + (response.data.message || "Unknown error"));
                }
            } else {
                // NORMAL CREATION / UPDATE
                // Create FormData for file upload
                const data = new FormData();
                Object.keys(formData).forEach(key => {
                    if (formData[key] !== null && formData[key] !== undefined) {
                        data.append(key, formData[key]);
                    }
                });

                let response;
                if (editingStudent) { // If editingStudent exists, it's an update
                    response = await api.put(`/students/${editingStudent.id}/`, data, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                } else { // Otherwise, it's a new creation
                    response = await api.post('/students/', data, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }

                if (response.data.success) {
                    // Refresh
                    if (viewMode === 'CLASS_LIST' && selectedClass) fetchStudentsByClass(selectedClass.code);
                    else fetchDashboardStats();
                    setShowAddModal(false);
                    setFormData(initialFormState);
                    // Show admission number in a friendly banner
                    if (response.data.admission_number) {
                        setSavedAdmissionNumber(response.data.admission_number);
                        setTimeout(() => setSavedAdmissionNumber(null), 8000);
                    } else {
                        alert('Student Saved Successfully!');
                    }
                } else {
                    alert("Failed to save student: " + (response.data.message || "Unknown error"));
                }
            }
        } catch (error) {
            console.error('Failed to save student:', error);
            alert('Failed to save student record. Please check inputs.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: files ? files[0] : value
        }));
        if (submitError) setSubmitError(null);
    };

    const confirmPayment = async (studentId, amount, desc = "Tuition Fee") => {
        try {
            await api.post('/accounts/payments/', {
                admission_number: studentId,
                amount: parseFloat(amount),
                description: desc
            });
            alert("Payment Recorded Successfully!");

            // Refresh
            if (managingPayments) {
                const txns = await fetchTransactions(studentId);
                setTransactions(txns);
            }
            if (viewMode === 'CLASS_LIST' && selectedClass) fetchStudentsByClass(selectedClass.code);
            else if (viewMode === 'DASHBOARD' && searchTerm) fetchGlobalSearch(searchTerm);

        } catch (error) {
            alert("Payment Failed: " + error.message);
        }
    };

    const handleTransactionUpdate = async (txnId, updates) => {
        try {
            await api.put(`/accounting/transactions/${txnId}/`, updates);
            if (managingPayments) {
                const txns = await fetchTransactions(managingPayments.admission_number);
                setTransactions(txns);
            }
        } catch (e) {
            alert("Update failed: " + e.message);
        }
    };

    const handleTransactionDelete = async (txnId) => {
        if (!confirm("Are you sure? This will reverse the payment.")) return;
        try {
            await api.delete(`/accounting/transactions/${txnId}/`);
            if (managingPayments) {
                const txns = await fetchTransactions(managingPayments.admission_number);
                setTransactions(txns);
            }
        } catch (e) {
            alert("Delete failed");
        }
    };

    // --- Render Helpers ---

    const StudentRow = (s) => (
        <>
            <td className="px-6 py-4">
                <span className="font-mono text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">{s.admission_number}</span>
            </td>
            <td className="px-6 py-4">
                <div
                    onClick={() => selectionMode === 'PAYMENT' ? handleMakePayment(s) : openProfile(s)}
                    className={`flex items-center gap-3 cursor-pointer group p-2 -ml-2 rounded-xl transition-all ${selectionMode === 'PAYMENT' ? 'hover:bg-[#ff851b]/10 border border-transparent hover:border-orange/20' : ''}`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${selectionMode === 'PAYMENT' ? 'bg-[#ff851b]/10 text-[#ff851b]' : 'bg-[#001f3f]/10 text-[#001f3f] group-hover:bg-[#001f3f] group-hover:text-white'}`}>
                        {s.first_name[0]}{s.last_name[0]}
                    </div>
                    <div>
                        <div className={`font-semibold transition-colors ${selectionMode === 'PAYMENT' ? 'text-[#001f3f] group-hover:text-[#ff851b]' : 'text-gray-900'}`}>{s.full_name}</div>
                        <div className="text-xs text-gray-400">{s.parent_phone || 'No Contact'}</div>
                    </div>
                    {selectionMode === 'PAYMENT' && <div className="ml-auto text-xs font-bold text-[#ff851b] bg-[#ff851b]/10 px-2 py-1 rounded">SELECT</div>}
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-700">{s.class_grade}</span>
                    <span className="text-xs text-gray-500">{s.student_type}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.payment_status === 'PAID' ? 'bg-green-50 text-green-700' :
                    s.payment_status === 'PARTIAL' ? 'bg-[#ff851b]-50 text-[#ff851b]-700' :
                        'bg-red-50 text-red-700'
                    }`}>
                    {s.payment_status}
                </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
                <div>Total: ₦{parseFloat(s.total_fees).toLocaleString()}</div>
                <div className="text-xs text-gray-400">Paid: ₦{parseFloat(s.amount_paid).toLocaleString()}</div>
            </td>
            <td className="px-6 py-4 text-sm font-bold text-red-600">
                {s.balance > 0 ? `₦${parseFloat(s.balance).toLocaleString()}` : <span className="text-green-600">Cleared</span>}
            </td>
            <td className="px-6 py-4 text-right relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // Get position relative to viewport
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDropdownPos({
                            top: rect.bottom + 5, // 5px gap
                            left: rect.left - 130 // Shift left to align (160px width approx)
                        });
                        setActiveDropdown(activeDropdown?.id === s.id ? null : s);
                    }}
                    className={`p-2 rounded-full transition ${activeDropdown?.id === s.id ? 'bg-[#001f3f] text-white' : 'text-gray-400 hover:text-[#001f3f] hover:bg-gray-100'}`}
                >
                    <MoreVertical size={18} />
                </button>
            </td>
        </>
    );



    // Filter Logic
    const filteredStats = classStats.filter(c => c.label.toLowerCase().includes(searchTerm.toLowerCase()));

    // In CLASS_LIST mode
    const filteredClassList = students.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen" onClick={() => setActiveDropdown(null)}>

            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
                {/* ... (Header Logic same as before) ... */}
                {viewMode === 'DASHBOARD' ? (
                    <div className="w-full">
                        <h1 className="text-2xl font-bold text-[#001f3f]">Class Overview</h1>
                        <p className="text-gray-500 text-sm mt-1">Select a class to manage students and fees.</p>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 w-full">
                        <button onClick={handleBackToDashboard} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition shadow-sm">
                            <ChevronDown className="rotate-90" size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-[#001f3f]">{selectedClass?.label}</h1>
                            <p className="text-gray-500 text-sm">Student List • {filteredClassList.length} Records</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ff851b] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={viewMode === 'DASHBOARD' ? "Search classes or students..." : "Filter list..."}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange/20 focus:border-orange transition outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                {selectionMode === 'PAYMENT' ? (
                    <div className="flex items-center gap-3 bg-[#ff851b]/10 border border-orange/20 px-4 py-2 rounded-xl">
                        <div className="text-sm font-bold text-[#ff851b]-800 flex items-center gap-2">
                            <Banknote size={16} /> Select Student to Pay
                        </div>
                        <button
                            onClick={() => setSelectionMode('VIEW')}
                            className="text-xs bg-white text-[#ff851b]-800 px-2 py-1 rounded border border-orange/10 hover:bg-[#ff851b]-50 font-bold"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setShowSelectionModal(true)} className="flex items-center gap-2 bg-[#001f3f] text-white px-5 py-2.5 rounded-xl hover:bg-[#001f3f]-light transition-all shadow-lg shadow-navy/20 font-medium text-sm whitespace-nowrap">
                        <Plus size={18} />
                        <span>Add Student</span>
                    </button>
                )}
            </div>


            {/* Admission Number Toast */}
            {savedAdmissionNumber && (
                <div className="fixed top-6 right-6 z-[500] bg-white border-2 border-green-400 rounded-2xl shadow-2xl p-5 flex items-center gap-4 animate-in slide-in-from-right-8 duration-300 max-w-sm">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={24} className="text-green-500" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Student Registered</div>
                        <div className="text-xl font-black text-[#001f3f] font-mono tracking-widest">{savedAdmissionNumber}</div>
                        <div className="text-xs text-gray-400 mt-0.5">Admission Number — note this down</div>
                    </div>
                    <button onClick={() => setSavedAdmissionNumber(null)} className="ml-auto text-gray-300 hover:text-gray-500 flex-shrink-0"><X size={16} /></button>
                </div>
            )}

            {/* Main Content */}
            {
                loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin h-8 w-8 border-4 border-navy border-t-transparent rounded-full opacity-50"></div>
                    </div>
                ) : viewMode === 'DASHBOARD' ? (
                    <div className="space-y-8">
                        {/* Global Search Results */}
                        {searchTerm && globalSearchResults.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#ff851b]/5">
                                    <h3 className="font-bold text-[#001f3f] flex items-center gap-2">
                                        <Search size={20} className="text-[#ff851b]" />
                                        Found {globalSearchResults.length} Matching Students
                                    </h3>
                                </div>
                                <Table
                                    headers={['Admission No', 'Full Name', 'Class & Type', 'Status', 'Fee Summary', 'Balance', 'Actions']}
                                    data={globalSearchResults}
                                    renderRow={StudentRow}
                                />
                            </div>
                        )}

                        {/* Class Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredStats.map((stats) => (
                                <div
                                    key={stats.code}
                                    onClick={() => handleClassClick(stats)}
                                    className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between h-full"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-[#001f3f]/5 text-[#001f3f] rounded-xl group-hover:bg-[#001f3f] group-hover:text-white transition-colors">
                                                <GraduationCap size={24} />
                                            </div>
                                            <div className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide">
                                                {stats.label}
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <div className="text-4xl font-black text-[#001f3f] mb-1">{stats.total_students}</div>
                                            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Students</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-[#ff851b]/5 rounded-xl p-3 text-center border border-orange/10">
                                                <div className="text-xs text-[#ff851b] font-bold uppercase mb-1">Boarding</div>
                                                <div className="text-xl font-black text-[#001f3f]">{stats.boarding}</div>
                                            </div>
                                            <div className="bg-blue-50/50 rounded-xl p-3 text-center border border-blue-100/50">
                                                <div className="text-xs text-blue-600 font-bold uppercase mb-1">Day</div>
                                                <div className="text-xl font-black text-[#001f3f]">{stats.day}</div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                                                <span>Fee Compliance</span>
                                                <span className="text-green-600">{stats.fully_paid} Paid</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${stats.total_students > 0 ? (stats.fully_paid / stats.total_students) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <Table
                        headers={canManagePayments
                            ? ['Admission No', 'Full Name', 'Class & Type', 'Status', 'Fee Summary', 'Balance', 'Actions']
                            : ['Admission No', 'Full Name', 'Class & Type', 'Actions']}
                        data={filteredClassList}
                        renderRow={StudentRow}
                    />
                )
            }

            {/* --- FIXED DROPDOWN --- */}
            {
                activeDropdown && (
                    <div
                        className="fixed bg-white rounded-xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200 w-40"
                        style={{ top: dropdownPos.top, left: dropdownPos.left }}
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(activeDropdown); setActiveDropdown(null); }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#001f3f] font-medium flex items-center gap-2"
                        >
                            <span>Edit Details</span>
                        </button>

                        {canManagePayments && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMakePayment(activeDropdown); }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#001f3f] font-medium flex items-center gap-2 border-t border-gray-50"
                                >
                                    <Banknote size={16} className="text-[#ff851b]" />
                                    <span>Make Payment</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); openPaymentManager(activeDropdown); setActiveDropdown(null); }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#001f3f] font-medium flex items-center gap-2 border-t border-gray-50"
                                >
                                    <span>History & Update</span>
                                </button>
                            </>
                        )}
                    </div>
                )
            }

            {/* --- MODALS --- */}

            {/* 1. SELECTION MODAL */}
            {
                showSelectionModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[#001f3f]/40 backdrop-blur-sm transition-opacity" onClick={() => setShowSelectionModal(false)} />
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 animate-in zoom-in-95 relative z-10">
                            <button onClick={() => setShowSelectionModal(false)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500"><X size={20} /></button>
                            <h2 className="text-xl font-bold text-[#001f3f] text-center mb-2">Student Management</h2>
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <button onClick={() => { setShowSelectionModal(false); openAddModal('NEW'); }} className="p-6 rounded-xl border border-gray-100 bg-[#ff851b]/5 hover:bg-[#ff851b] hover:border-orange text-[#ff851b] hover:text-white transition flex flex-col items-center gap-3 group">
                                    <UserPlus size={28} />
                                    <span className="font-bold">New Student</span>
                                    <span className="text-xs opacity-70">Register a new admission</span>
                                </button>
                                <button onClick={() => { setShowSelectionModal(false); setShowPromoteModal(true); }} className="p-6 rounded-xl border border-gray-100 bg-[#001f3f]/5 hover:bg-[#001f3f] hover:border-navy text-[#001f3f] hover:text-white transition flex flex-col items-center gap-3 group">
                                    <GraduationCap size={28} />
                                    <span className="font-bold">Promote Class</span>
                                    <span className="text-xs opacity-70">Bulk move to next class</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* PROMOTE CLASS MODAL */}
            {
                showPromoteModal && (
                    <PromoteClassModal
                        onClose={() => setShowPromoteModal(false)}
                        onSuccess={() => { fetchDashboardStats(); setShowPromoteModal(false); }}
                        classStats={classStats}
                    />
                )
            }



            {/* PAYMENT MODAL */}
            {
                paymentModalOpen && (
                    <PaymentModal
                        student={paymentStudent}
                        onClose={() => setPaymentModalOpen(false)}
                        onSuccess={() => {
                            // Refresh Data
                            if (viewMode === 'CLASS_LIST' && selectedClass) fetchStudentsByClass(selectedClass.code);
                            else fetchDashboardStats();
                            // Also refresh profile if open
                            if (viewProfile) openProfile(viewProfile);
                        }}
                    />
                )
            }

            {/* 2. ADD / EDIT MODAL */}
            {
                showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[#001f3f]/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                            {/* Reusing the form logic but with better modularity */}
                            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl">
                                <h2 className="text-xl font-bold text-[#001f3f] flex items-center gap-2">
                                    {editingStudent ? 'Edit Student Details' : 'Student Admission'}
                                </h2>
                                <button onClick={() => setShowAddModal(false)}><X size={20} className="text-gray-400" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                                {/* --- RETURNING STUDENT SEARCH workflow --- */}
                                {formData.student_status === 'RETURNING' && !formData.id ? (
                                    <div className="space-y-6">
                                        <div className="text-center p-6 bg-blue-50 rounded-2xl border border-blue-100">
                                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search size={32} />
                                            </div>
                                            <h3 className="text-lg font-bold text-[#001f3f] mb-2">Find Student Record</h3>
                                            <p className="text-gray-500 text-sm mb-6">Search by Admission Number, Full Name, or Parent Phone to promote or re-enroll.</p>

                                            <div className="relative max-w-md mx-auto">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Enter Admission No or Name..."
                                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm"
                                                    onChange={(e) => {
                                                        const term = e.target.value.toLowerCase();
                                                        if (term.length > 1) {
                                                            const results = students.filter(s =>
                                                                s.admission_number.toLowerCase().includes(term) ||
                                                                s.full_name.toLowerCase().includes(term) ||
                                                                s.parent_phone.includes(term)
                                                            );
                                                            setGlobalSearchResults(results);
                                                        } else {
                                                            setGlobalSearchResults([]);
                                                        }
                                                    }}
                                                />
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                            </div>

                                            {globalSearchResults.length > 0 && (
                                                <div className="mt-4 text-left bg-white rounded-xl shadow-lg border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                                                    {globalSearchResults.slice(0, 5).map(s => (
                                                        <div
                                                            key={s.id}
                                                            onClick={() => {
                                                                // Populate form with existing data
                                                                setFormData({
                                                                    ...initialFormState,
                                                                    ...s,
                                                                    student_status: 'RETURNING',
                                                                    // Pre-fill next session logic if possible?
                                                                });
                                                                setEditingStudent(s); // Mark as editing existing
                                                                setGlobalSearchResults([]);
                                                            }}
                                                            className="p-4 hover:bg-gray-50 cursor-pointer transition flex justify-between items-center group"
                                                        >
                                                            <div>
                                                                <div className="font-bold text-[#001f3f]">{s.full_name}</div>
                                                                <div className="text-xs text-gray-500">{s.admission_number} • {s.class_grade}</div>
                                                            </div>
                                                            <div className="text-blue-600 opacity-0 group-hover:opacity-100 text-sm font-medium">Select</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <form id="student-form" onSubmit={handleSubmit} className="space-y-8">

                                        {/* Promotion Banner */}
                                        {formData.student_status === 'RETURNING' && (
                                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-4 mb-6">
                                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mt-1"><GraduationCap size={20} /></div>
                                                <div>
                                                    <h4 className="font-bold text-blue-900">Promotion / Re-enrollment Mode</h4>
                                                    <p className="text-sm text-blue-700 mt-1">
                                                        You are updating record for <span className="font-bold">{formData.first_name} {formData.last_name}</span>.
                                                        Please select the new Class and Session below. Check previous debt before proceeding.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Section 1: Academic Info */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Academic Information</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                                    <input disabled={formData.student_status === 'RETURNING'} required name="first_name" value={formData.first_name} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none disabled:bg-gray-100 disabled:text-gray-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                                    <input disabled={formData.student_status === 'RETURNING'} required name="last_name" value={formData.last_name} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none disabled:bg-gray-100 disabled:text-gray-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Class</label>
                                                    <select name="class_grade" value={formData.class_grade} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none font-bold bg-[#ff851b]/5 text-[#001f3f]">
                                                        {classStats.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Boarding Status</label>
                                                    <select name="student_type" value={formData.student_type} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none">
                                                        <option value="DAY">Day Student</option>
                                                        <option value="BOARDING">Boarding Student</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Admission Date <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        required
                                                        type="date"
                                                        name="date_of_admission"
                                                        value={formData.date_of_admission || ''}
                                                        onChange={handleInputChange}
                                                        max={new Date().toISOString().split('T')[0]}
                                                        disabled={formData.student_status === 'RETURNING'}
                                                        className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Previous School</label>
                                                    <input disabled={formData.student_status === 'RETURNING'} name="previous_school" value={formData.previous_school || ''} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none disabled:bg-gray-100 disabled:text-gray-500" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 2: Bio Data */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Bio Data</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                                    <input type="date" name="date_of_birth" value={formData.date_of_birth || ''} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                                    <select name="gender" value={formData.gender || 'MALE'} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none">
                                                        <option value="MALE">Male</option>
                                                        <option value="FEMALE">Female</option>
                                                    </select>
                                                </div>

                                                {/* Nationality → State → LGA */}
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                                                    <select
                                                        name="nationality"
                                                        value={formData.nationality || 'Nigerian'}
                                                        onChange={e => {
                                                            handleInputChange(e);
                                                            // Reset state & LGA when nationality changes
                                                            setFormData(prev => ({ ...prev, nationality: e.target.value, state_of_origin: '', lga: '' }));
                                                        }}
                                                        className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                                    >
                                                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">State of Origin</label>
                                                    {formData.nationality === 'Nigerian' ? (
                                                        <select
                                                            name="state_of_origin"
                                                            value={formData.state_of_origin || ''}
                                                            onChange={e => {
                                                                setFormData(prev => ({ ...prev, state_of_origin: e.target.value, lga: '' }));
                                                            }}
                                                            className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                                        >
                                                            <option value="">-- Select State --</option>
                                                            {NIGERIA_STATE_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    ) : (
                                                        <input name="state_of_origin" value={formData.state_of_origin || ''} onChange={handleInputChange} placeholder="State / Province" className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none" />
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">LGA / District</label>
                                                    {formData.nationality === 'Nigerian' ? (
                                                        <select
                                                            name="lga"
                                                            value={formData.lga || ''}
                                                            onChange={handleInputChange}
                                                            disabled={!formData.state_of_origin}
                                                            className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                                        >
                                                            <option value="">{formData.state_of_origin ? '-- Select LGA --' : '-- Select State First --'}</option>
                                                            {(NIGERIA_STATES_LGAS[formData.state_of_origin] || []).map(lga => <option key={lga} value={lga}>{lga}</option>)}
                                                        </select>
                                                    ) : (
                                                        <input name="lga" value={formData.lga || ''} onChange={handleInputChange} placeholder="LGA / District" className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none" />
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Session</label>
                                                    <input name="current_session" value={formData.current_session} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none" placeholder="e.g 2025/2026" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                                                    <select name="religion" value={formData.religion || ''} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none">
                                                        <option value="">Select...</option>
                                                        <option value="Christianity">Christianity</option>
                                                        <option value="Islam">Islam</option>
                                                        <option value="Traditional">Traditional</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 3: Guardian Info */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Parent / Guardian Information</h3>

                                            {/* Primary Guardian */}
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase">Primary Guardian</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                                        <input required name="parent_name" value={formData.parent_name} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                                        <input required name="parent_phone" value={formData.parent_phone} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                                                        <input type="email" name="parent_email" value={formData.parent_email} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none" />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Home Address</label>
                                                        <textarea name="parent_address" value={formData.parent_address || ''} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none" rows="2"></textarea>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Father / Mother optional fields could go here or be simpler */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                                                    <input name="father_name" value={formData.father_name || ''} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                                                    <input name="mother_name" value={formData.mother_name || ''} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 4: Medical */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Medical & Emergency</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                                                    <select name="blood_group" value={formData.blood_group || ''} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none">
                                                        <option value="">Select...</option>
                                                        <option value="A+">A+</option>
                                                        <option value="A-">A-</option>
                                                        <option value="B+">B+</option>
                                                        <option value="B-">B-</option>
                                                        <option value="O+">O+</option>
                                                        <option value="O-">O-</option>
                                                        <option value="AB+">AB+</option>
                                                        <option value="AB-">AB-</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Genotype</label>
                                                    <input name="genotype" value={formData.genotype || ''} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none" placeholder="e.g AA, AS" />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions / Allergies</label>
                                                    <textarea name="medical_conditions" value={formData.medical_conditions || ''} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none" rows="2"></textarea>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                                                    <input name="emergency_contact_name" value={formData.emergency_contact_name || ''} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                                                    <input name="emergency_contact_phone" value={formData.emergency_contact_phone || ''} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-navy focus:ring-1 focus:ring-navy outline-none" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white border-t border-gray-50 p-4 -mx-8 -mb-8">
                                            <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition">Cancel</button>
                                            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-[#001f3f] text-white font-bold hover:bg-[#001f3f]-light shadow-lg shadow-navy/20 transition flex items-center gap-2">
                                                {isSubmitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span> : <><CheckCircle size={20} /> <span>Save Student Record</span></>}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 3. PROFILE MODAL (Detailed View + History) */}
            {
                viewProfile && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[#001f3f]/80 backdrop-blur-sm" onClick={() => setViewProfile(null)} />
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col animate-in zoom-in-95">
                            {/* Header Profile Card */}
                            <div className="bg-[#001f3f] p-8 text-white flex justify-between items-start">
                                <div className="flex gap-6 items-center">
                                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white/20">
                                        {viewProfile.first_name[0]}{viewProfile.last_name[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold">{viewProfile.full_name || `${viewProfile.first_name} ${viewProfile.last_name}`}</h2>
                                        <div className="flex items-center gap-3 mt-2 text-white/70">
                                            <span className="bg-white/10 px-2 py-1 rounded text-xs font-mono">{viewProfile.admission_number}</span>
                                            <span>•</span>
                                            <span>{viewProfile.class_grade}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setViewProfile(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"><X size={20} /></button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-gray-200 bg-white px-8">
                                <button
                                    onClick={() => setViewProfile(prev => ({ ...prev, tab: 'INFO' }))}
                                    className={`py-4 px-4 font-bold text-sm border-b-2 transition ${(!viewProfile.tab || viewProfile.tab === 'INFO') ? 'border-orange text-[#001f3f]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Student Info & Finance
                                </button>
                                <button
                                    onClick={() => {
                                        setViewProfile(prev => ({ ...prev, tab: 'ACADEMICS' }));
                                        // Fetch Report if not already
                                        if (!viewProfile.report) {
                                            api.get(`/academics/student-report/?student_id=${viewProfile.id}`).then(res => {
                                                setViewProfile(prev => ({ ...prev, report: res.data }));
                                            });
                                        }
                                    }}
                                    className={`py-4 px-4 font-bold text-sm border-b-2 transition ${(viewProfile.tab === 'ACADEMICS') ? 'border-orange text-[#001f3f]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Academic Report
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                                {viewProfile.tab === 'ACADEMICS' ? (
                                    viewProfile.report ? (
                                        <div className="space-y-6">
                                            {/* Summary Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                                    <div className="text-xs text-gray-500 uppercase font-bold">Total Score</div>
                                                    <div className="text-2xl font-black text-[#001f3f]">{viewProfile.report.summary.total_score}</div>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                                    <div className="text-xs text-gray-500 uppercase font-bold">Average</div>
                                                    <div className="text-2xl font-black text-orange-500">{viewProfile.report.summary.average}%</div>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                                    <div className="text-xs text-gray-500 uppercase font-bold">Subjects</div>
                                                    <div className="text-2xl font-black text-green-600">{viewProfile.report.summary.subjects_offered}</div>
                                                </div>
                                            </div>

                                            {/* Results Table */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                                                        <tr>
                                                            <th className="px-6 py-3">Subject</th>
                                                            <th className="px-4 py-3 text-center">Test</th>
                                                            <th className="px-4 py-3 text-center">Assign</th>
                                                            <th className="px-4 py-3 text-center">MidTerm</th>
                                                            <th className="px-4 py-3 text-center">Exam</th>
                                                            <th className="px-4 py-3 text-center font-black bg-gray-100">Total</th>
                                                            <th className="px-4 py-3 text-center">Grade</th>
                                                            <th className="px-6 py-3">Remark</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {viewProfile.report.results.map((r, i) => (
                                                            <tr key={i} className="hover:bg-gray-50">
                                                                <td className="px-6 py-3 font-medium text-[#001f3f]">{r.subject}</td>
                                                                <td className="px-4 py-3 text-center text-gray-500">{parseFloat(r.test)}</td>
                                                                <td className="px-4 py-3 text-center text-gray-500">{parseFloat(r.assignment)}</td>
                                                                <td className="px-4 py-3 text-center text-gray-500">{parseFloat(r.midterm)}</td>
                                                                <td className="px-4 py-3 text-center text-gray-500">{parseFloat(r.exam)}</td>
                                                                <td className="px-4 py-3 text-center font-black text-[#001f3f] bg-gray-50">{parseFloat(r.total)}</td>
                                                                <td className={`px-4 py-3 text-center font-bold ${r.grade === 'F' ? 'text-red-600' : 'text-green-600'}`}>{r.grade}</td>
                                                                <td className="px-6 py-3 text-xs font-bold text-gray-400">{r.remark}</td>
                                                            </tr>
                                                        ))}
                                                        {viewProfile.report.results.length === 0 && (
                                                            <tr>
                                                                <td colSpan="8" className="p-8 text-center text-gray-400">No academic records found for this term.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-center py-12">
                                            <div className="animate-spin h-8 w-8 border-4 border-navy border-t-transparent rounded-full opacity-50"></div>
                                        </div>
                                    )
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {/* Left: Info */}
                                        <div className="space-y-6">
                                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                                <h3 className="font-bold text-[#001f3f] mb-4 flex items-center gap-2"><User size={18} /> Guardian Info</h3>
                                                <div className="space-y-3 text-sm">
                                                    <div>
                                                        <label className="block text-gray-400 text-xs">Name</label>
                                                        <div className="font-medium text-gray-800">{viewProfile.parent_name}</div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-400 text-xs">Contact</label>
                                                        <div className="font-medium text-gray-800">{viewProfile.parent_phone}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                                <h3 className="font-bold text-[#001f3f] mb-4 flex items-center gap-2"><CreditCard size={18} /> Fee Summary</h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Total Payable</span>
                                                        <span className="font-bold">₦{parseFloat(viewProfile.total_fees || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Amount Paid</span>
                                                        <span className="font-bold text-green-600">₦{parseFloat(viewProfile.amount_paid || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="pt-3 border-t border-gray-100 flex justify-between">
                                                        <span className="text-gray-500 font-medium">Balance</span>
                                                        <span className="font-black text-red-500">₦{parseFloat(viewProfile.balance || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Payment History */}
                                        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                                <h3 className="font-bold text-[#001f3f] flex items-center gap-2">Transaction History</h3>
                                                <div className="text-xs text-gray-400">{transactions.length} records</div>
                                            </div>
                                            <div className="flex-1 overflow-auto max-h-[400px]">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                                        <tr>
                                                            <th className="p-4 font-semibold">Date</th>
                                                            <th className="p-4 font-semibold">Ref</th>
                                                            <th className="p-4 font-semibold">Desc</th>
                                                            <th className="p-4 font-semibold text-right">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {transactions.map(t => (
                                                            <tr key={t.id} className="hover:bg-gray-50">
                                                                <td className="p-4 text-gray-600">{new Date(t.date_paid).toLocaleDateString()}</td>
                                                                <td className="p-4 font-mono text-xs text-[#ff851b] bg-[#ff851b]/5 px-2 py-1 rounded w-fit">{t.reference_number}</td>
                                                                <td className="p-4">{t.description || "School Fee Payment"}</td>
                                                                <td className="p-4 text-green-600 font-bold text-right">+₦{parseFloat(t.amount_paid).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                        {transactions.length === 0 && (
                                                            <tr>
                                                                <td colSpan="4" className="p-8 text-center text-gray-400">No transactions recorded.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 4. PAYMENT MANAGER (Update Modal) */}
            {
                managingPayments && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[#001f3f]/80 backdrop-blur-sm" onClick={() => setManagingPayments(null)} />
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative z-10 animate-in zoom-in-95">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#001f3f] text-white">
                                <h3 className="font-bold text-lg">Manage Payments - {managingPayments.full_name}</h3>
                                <button onClick={() => setManagingPayments(null)}><X size={20} /></button>
                            </div>

                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                <p className="text-gray-500 text-sm mb-4">Edit or remove existing payment records for this student. Balance will be recalculated automatically.</p>
                                <div className="space-y-3">
                                    {transactions.map(t => (
                                        <div key={t.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition">
                                            <div className="bg-green-100 text-green-600 p-2 rounded-lg"><CreditCard size={20} /></div>
                                            <div className="flex-1">
                                                <div className="font-bold text-[#001f3f]">₦{parseFloat(t.amount_paid).toLocaleString()}</div>
                                                <div className="text-xs text-gray-500">{t.description} • {new Date(t.date_paid).toLocaleDateString()}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const newAmt = prompt("Enter new amount:", t.amount_paid);
                                                        if (newAmt && !isNaN(newAmt)) handleTransactionUpdate(t.id, { amount_paid: parseFloat(newAmt) });
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleTransactionDelete(t.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {transactions.length === 0 && <div className="text-center text-gray-400 py-6">No payment records to edit.</div>}
                                </div>

                                {/* Add New Payment (Shortcut) */}
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <button
                                        onClick={() => {
                                            const amount = prompt("Enter Amount to Pay:");
                                            const desc = prompt("Payment Description:", "Tuition Fee");
                                            if (amount) confirmPayment(managingPayments.admission_number, amount, desc);
                                        }}
                                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                    >
                                        <Plus size={18} /> Record New Payment
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

// ─── Promote Class Modal (3-step wizard) ─────────────────────────────────────
const PromoteClassModal = ({ onClose, onSuccess, classStats }) => {
    const CLASS_CHOICES = classStats.map(s => ({ code: s.code, label: s.label }));
    const SESSIONS = ['2025/2026', '2026/2027', '2027/2028', '2026/2025'];

    const [step, setStep] = useState(1);
    const [config, setConfig] = useState({
        from_class: CLASS_CHOICES[0]?.code || '',
        to_class: CLASS_CHOICES[1]?.code || '',
        new_session: '2026/2027',
        comments: ''
    });
    const [preview, setPreview] = useState(null);
    const [selected, setSelected] = useState({}); // id → true/false
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    // Step 1 → 2: load preview
    const loadPreview = async () => {
        if (!config.from_class || !config.to_class || !config.new_session) {
            alert('Please fill all fields'); return;
        }
        if (config.from_class === config.to_class) {
            alert('From and To class cannot be the same'); return;
        }
        setLoading(true);
        try {
            const res = await api.get('/students/preview-promotion/', {
                params: { from_class: config.from_class, session: config.new_session.split('/')[0] + '/' + (parseInt(config.new_session.split('/')[0]) - 1) }
            });
            // Use current session for grade lookup (session before the new one)
            const res2 = await api.get('/students/preview-promotion/', {
                params: { from_class: config.from_class }
            });
            setPreview(res2.data);
            // Pre-select all qualifying students
            const sel = {};
            res2.data.students.forEach(s => { sel[s.id] = s.qualifies; });
            setSelected(sel);
            setStep(2);
        } catch (e) {
            alert('Failed to load preview: ' + (e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    // Step 2 → 3: run promotion
    const runPromotion = async () => {
        const student_ids = Object.entries(selected)
            .filter(([, v]) => v)
            .map(([k]) => parseInt(k));

        if (student_ids.length === 0) {
            alert('No students selected for promotion'); return;
        }
        setLoading(true);
        try {
            const res = await api.post('/students/bulk-promote/', {
                from_class: config.from_class,
                to_class: config.to_class,
                new_session: config.new_session,
                student_ids,
                comments: config.comments
            });
            setResult(res.data);
            setStep(3);
        } catch (e) {
            alert('Promotion failed: ' + (e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    const selectedCount = Object.values(selected).filter(Boolean).length;
    const fromLabel = CLASS_CHOICES.find(c => c.code === config.from_class)?.label || config.from_class;
    const toLabel = CLASS_CHOICES.find(c => c.code === config.to_class)?.label || config.to_class;

    const statusBadge = (gs) => {
        if (gs === 'PASS') return 'bg-green-100 text-green-700';
        if (gs === 'FAIL') return 'bg-red-100 text-red-600';
        return 'bg-gray-100 text-gray-500';
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#001f3f]/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95">

                {/* Header */}
                <div className="bg-[#001f3f] text-white px-8 py-5 rounded-t-2xl flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Promote Class</h2>
                        <p className="text-white/60 text-sm">Step {step} of 3 — {step === 1 ? 'Configure' : step === 2 ? 'Review Students' : 'Done'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"><X size={18} /></button>
                </div>

                {/* Step Indicators */}
                <div className="flex px-8 pt-5 gap-3">
                    {[1, 2, 3].map(n => (
                        <div key={n} className={`flex-1 h-1.5 rounded-full transition-all ${step >= n ? 'bg-orange-500' : 'bg-gray-200'}`} />
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-8">

                    {/* ── STEP 1: Configure ── */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">From Class</label>
                                    <select
                                        className="w-full p-3 border rounded-xl bg-gray-50 font-bold text-[#001f3f] focus:ring-2 focus:ring-orange-400 outline-none"
                                        value={config.from_class}
                                        onChange={e => setConfig(c => ({ ...c, from_class: e.target.value }))}
                                    >
                                        {CLASS_CHOICES.map(cls => <option key={cls.code} value={cls.code}>{cls.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">To Class (Next)</label>
                                    <select
                                        className="w-full p-3 border rounded-xl bg-gray-50 font-bold text-[#001f3f] focus:ring-2 focus:ring-orange-400 outline-none"
                                        value={config.to_class}
                                        onChange={e => setConfig(c => ({ ...c, to_class: e.target.value }))}
                                    >
                                        {CLASS_CHOICES.map(cls => <option key={cls.code} value={cls.code}>{cls.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">New Academic Session</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-xl bg-gray-50 font-bold focus:ring-2 focus:ring-orange-400 outline-none"
                                    placeholder="e.g. 2026/2027"
                                    value={config.new_session}
                                    onChange={e => setConfig(c => ({ ...c, new_session: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Promotion Note (Optional)</label>
                                <textarea
                                    className="w-full p-3 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-orange-400 outline-none resize-none"
                                    rows={2}
                                    placeholder="e.g. End of 2025/2026 session promotion"
                                    value={config.comments}
                                    onChange={e => setConfig(c => ({ ...c, comments: e.target.value }))}
                                />
                            </div>

                            {/* Arrow preview */}
                            <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <span className="font-bold text-[#001f3f] bg-white px-4 py-2 rounded-lg border border-gray-200">{fromLabel}</span>
                                <span className="text-2xl text-orange-400">→</span>
                                <span className="font-bold text-[#001f3f] bg-white px-4 py-2 rounded-lg border border-gray-200">{toLabel}</span>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Review Students ── */}
                    {step === 2 && preview && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    <span className="font-bold text-[#001f3f]">{preview.total}</span> students in {fromLabel}
                                    {' · '}
                                    <span className="font-bold text-orange-500">{selectedCount} selected</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => {
                                        const sel = {};
                                        preview.students.forEach(s => { sel[s.id] = true; });
                                        setSelected(sel);
                                    }} className="text-xs font-bold text-blue-600 hover:underline">Select All</button>
                                    <span className="text-gray-300">|</span>
                                    <button onClick={() => {
                                        const sel = {};
                                        preview.students.forEach(s => { sel[s.id] = s.qualifies; });
                                        setSelected(sel);
                                    }} className="text-xs font-bold text-green-600 hover:underline">Qualifying Only</button>
                                    <span className="text-gray-300">|</span>
                                    <button onClick={() => {
                                        const sel = {};
                                        preview.students.forEach(s => { sel[s.id] = false; });
                                        setSelected(sel);
                                    }} className="text-xs font-bold text-red-500 hover:underline">Clear</button>
                                </div>
                            </div>

                            {preview.students.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
                                    <p>No active students found in {fromLabel}</p>
                                </div>
                            ) : (
                                <div className="border rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3 text-left w-10">
                                                    <input type="checkbox"
                                                        checked={selectedCount === preview.students.length}
                                                        onChange={e => {
                                                            const sel = {};
                                                            preview.students.forEach(s => { sel[s.id] = e.target.checked; });
                                                            setSelected(sel);
                                                        }}
                                                        className="rounded"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left">Student</th>
                                                <th className="px-4 py-3 text-center">Type</th>
                                                <th className="px-4 py-3 text-center">Grade Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {preview.students.map(s => (
                                                <tr key={s.id} className={`transition-colors ${selected[s.id] ? 'bg-white' : 'bg-gray-50/60 opacity-60'}`}>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!selected[s.id]}
                                                            onChange={e => setSelected(prev => ({ ...prev, [s.id]: e.target.checked }))}
                                                            className="rounded"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-[#001f3f]">{s.full_name}</div>
                                                        <div className="text-xs text-gray-400 font-mono">{s.admission_number}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.student_type === 'BOARDING' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                            {s.student_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusBadge(s.grade_status)}`}>
                                                            {s.grade_status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 3: Result ── */}
                    {step === 3 && result && (
                        <div className="text-center py-6 space-y-6">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle size={40} className="text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#001f3f]">{result.promoted} Students Promoted</h3>
                                <p className="text-gray-500 mt-1">{fromLabel} → {toLabel} • {config.new_session}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                    <div className="text-2xl font-black text-green-600">{result.promoted}</div>
                                    <div className="text-xs text-green-600 font-bold uppercase">Promoted</div>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                    <div className="text-2xl font-black text-orange-500">{result.skipped}</div>
                                    <div className="text-xs text-orange-500 font-bold uppercase">Skipped</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="text-2xl font-black text-gray-600">{result.errors?.length || 0}</div>
                                    <div className="text-xs text-gray-400 font-bold uppercase">Errors</div>
                                </div>
                            </div>
                            {result.errors?.length > 0 && (
                                <div className="text-left p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-600">
                                    {result.errors.map((e, i) => <div key={i}>Student {e.student_id}: {e.error}</div>)}
                                </div>
                            )}
                            <p className="text-sm text-gray-500">All previous academic records and history have been preserved.</p>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="px-8 py-5 border-t border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-b-2xl">
                    {step === 1 && (
                        <>
                            <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600 transition">Cancel</button>
                            <button
                                onClick={loadPreview}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#001f3f] text-white font-bold rounded-xl hover:bg-orange-500 transition disabled:opacity-50"
                            >
                                {loading ? 'Loading...' : 'Preview Students →'}
                            </button>
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <button onClick={() => setStep(1)} className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600 transition">← Back</button>
                            <button
                                onClick={runPromotion}
                                disabled={loading || selectedCount === 0}
                                className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition disabled:opacity-40"
                            >
                                {loading ? 'Promoting...' : `Promote ${selectedCount} Student${selectedCount !== 1 ? 's' : ''} →`}
                            </button>
                        </>
                    )}
                    {step === 3 && (
                        <>
                            <div />
                            <button
                                onClick={onSuccess}
                                className="px-6 py-2.5 bg-[#001f3f] text-white font-bold rounded-xl hover:bg-orange-500 transition"
                            >
                                Done
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export const Inventory = InventoryComponent;

export const Accounts = AccountsComponent;
// ... (keep all your existing code at the top)


// ✅ ADD THIS LINE TO FIX THE CRASH
export const Academics = AcademicsComponent;

// --- User Management Component ---
function UserManagement({ user }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [formData, setFormData] = useState({
        id: null,
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'TEACHER',
        is_active: true,
        password: '',
        reset_password: ''
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users/');
            setUsers(res.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            alert("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenAdd = () => {
        setFormData({ id: null, username: '', email: '', first_name: '', last_name: '', role: 'TEACHER', is_active: true, password: '', reset_password: '' });
        setEditMode(false);
        setShowModal(true);
    };

    const handleOpenEdit = (u) => {
        setFormData({
            id: u.id,
            username: u.username,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            role: u.role,
            is_active: u.is_active,
            password: '',
            reset_password: ''
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/users/${formData.id}/`, formData);
            } else {
                await api.post('/users/', formData);
            }
            setShowModal(false);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.error || "Error saving user");
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.first_name && u.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.last_name && u.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Only allow Principal and Super Admin
    if (!['PRINCIPAL', 'SUPER_ADMIN'].includes(user?.role) && !user?.is_superuser) {
        return (
            <div className="p-8 text-center text-red-500 font-bold bg-red-50 rounded-2xl m-8">
                <AlertCircle size={48} className="mx-auto mb-4" />
                You do not have permission to view User Management.
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-[#001f3f] tracking-tight">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage staff accounts, roles, and access.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-[#001f3f] text-white px-5 py-2.5 rounded-xl hover:bg-[#001f3f]-light transition-all shadow-lg shadow-navy/20 font-bold"
                >
                    <Plus size={20} /> New User
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#001f3f]/5 border-b border-[#001f3f]/10 text-[#001f3f] font-bold">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Last Login</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#001f3f]" />
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-medium">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-[#001f3f]/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-[#001f3f]">{u.first_name} {u.last_name}</div>
                                            <div className="text-gray-500 text-xs">@{u.username} • {u.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                u.role === 'PRINCIPAL' ? 'bg-blue-100 text-blue-700' :
                                                    u.role === 'ACCOUNT_OFFICER' ? 'bg-green-100 text-green-700' :
                                                        'bg-orange-100 text-orange-700'
                                                }`}>
                                                {u.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.is_active ? (
                                                <span className="flex items-center gap-1 text-green-600 text-xs font-bold"><CheckCircle2 size={14} /> Active</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-600 text-xs font-bold"><XCircle size={14} /> Inactive</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleOpenEdit(u)}
                                                className="text-[#001f3f] bg-[#001f3f]/10 hover:bg-[#001f3f] hover:text-white p-2 rounded-lg transition-colors font-medium text-xs flex items-center justify-center gap-1 ml-auto"
                                            >
                                                <Edit size={14} /> Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-[#001f3f]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h3 className="font-bold text-lg text-[#001f3f] flex items-center gap-2">
                                <Users className="text-orange-500" />
                                {editMode ? 'Edit User Profile' : 'Create New User'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">First Name</label>
                                    <input
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium text-[#001f3f]"
                                        value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Last Name</label>
                                    <input
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium text-[#001f3f]"
                                        value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Username *</label>
                                    <input
                                        required
                                        disabled={editMode}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium text-[#001f3f] disabled:bg-gray-100 disabled:text-gray-400"
                                        value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium text-[#001f3f]"
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">User Role</label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium text-[#001f3f] bg-white"
                                        value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        disabled={user.role === 'PRINCIPAL' && formData.role === 'SUPER_ADMIN'}
                                    >
                                        <option value="TEACHER">Teacher</option>
                                        <option value="CASHIER">Cashier</option>
                                        <option value="ACCOUNT_OFFICER">Account Officer</option>
                                        <option value="PRINCIPAL">Principal</option>
                                        {(user.role === 'SUPER_ADMIN' || user.is_superuser) && <option value="SUPER_ADMIN">Super Admin</option>}
                                    </select>
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${formData.is_active ? 'left-7' : 'left-1'}`} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 group-hover:text-[#001f3f] transition-colors">
                                            Account Active
                                        </span>
                                        <input
                                            type="checkbox" className="hidden"
                                            checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                    </label>
                                </div>
                            </div>

                            <hr className="border-gray-100 my-4" />

                            {!editMode ? (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Initial Password *</label>
                                    <input
                                        required
                                        type="password"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium text-[#001f3f]"
                                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Key size={14} className="text-orange-500" /> Reset Password <span className="text-gray-400 font-normal lowercase">(Leave blank if unchanged)</span>
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Enter new password to reset"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-navy focus:ring-4 focus:ring-navy/5 outline-none font-medium text-[#001f3f]"
                                        value={formData.reset_password} onChange={e => setFormData({ ...formData, reset_password: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end pt-4 gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="bg-[#001f3f] text-white px-8 py-2.5 rounded-xl font-bold hover:bg-[#001f3f]-light transition-all shadow-lg shadow-navy/20">
                                    {editMode ? 'Save Changes' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export { UserManagement };
